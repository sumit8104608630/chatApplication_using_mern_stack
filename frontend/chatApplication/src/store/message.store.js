import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import { Contact } from "lucide-react"
import { authStore } from "./userAuth.store"
import { Socket } from "socket.io-client"

export const messageStore=create((set,get)=>({
    contacts:[],
    messages:[],
    mediaLoading:false,
    contactCache:{},
    filterLoading:false,
    filterArray:[],
    notify:[],
    cacheMedia:{},
    allContactVideoMessages:[],
    allContactImageMessages:[],
    messageForwarding:false,
    messageSendingLoading:false,
    messageLoading:false,
    selectedUser:null,
    contactsLoading:false,
    get_all_contacts:async()=>{
        try {
            set({contactsLoading:true})
            const response=await axiosInstance.get(`/user/get_contact`);
            set({contacts:response.data.data.contacts})
        } catch (error) {
            console.log(error)
        }
        finally{
            set({contactsLoading:false})

        }
    },
    //let's create filter function
    filter_contacts: async (query,activeTab) => {
        set({filterLoading:true})
        const {contactCache}=get()
        const { contacts } = get();
        try {
          if (activeTab==="contacts") {
            const result = contactCache[query];
            if (result) {
              set({ filterArray: result });
              set({filterLoading:false})

            }
            else{
            const response = await axiosInstance.get(`/user/searchUser?searchQuery=${query}`);
            if (response.status === 200) {
              const matchedUser = response.data.data;
              const filterContact = contacts.filter(contact => {
            return matchedUser.some(user=>contact.userId && contact.userId._id && contact.userId._id === user._id)
              });
              
              set(state => ({ 
             contactCache:{
                ...state.contactCache,[query]:filterContact
             },
                filterArray: filterContact,
                filterLoading: false
            }));
            }
            set({filterLoading:false})
        }
          }
        } catch (error) {
            set({filterLoading:false})

          console.log("Error filtering contacts:", error);
        }
    },
    getNewContact:()=>{
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.on("new_contact",(data)=>{
            const {contacts}=get()
const condition=contacts.some((item)=>item.phone==data.phone);
if(!condition){
          set({contacts:[...contacts,data]})
}
        })
        
      },
      unSubScrContact:()=>{
        // let's unSubScribe
        const socket=authStore.getState().socket;
        if(!socket)return
        socket.off('new_contact')
    },
    update_message_array_received:async(activeContact)=>{
        try {
            
            const response=await axiosInstance.post(`/message/update_message_array_received`,{activeContact});
            console.log(response);
        } catch (error) {
            console.log(error)
        }
    },
    locallyUpdateMessage: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status == "sent" && message.isOwn
                ? {...message, status: "received"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
    update_message_array_to_seen:async(contact_id)=>{
        try {
            await axiosInstance.post(`/message/update_message_array_seen`,{contact_id});
        } catch (error) {
            console.log(error)
        }
    },
    send_message:async(data)=>{
        try {
            set({messageSendingLoading:true})
            const {messages,cacheMedia}=get();
            const response =await axiosInstance.post(`/message/save_message`,data);
            set({messages:[...messages,response.data.data]})
            if (response.data.data.image || response.data.data.video) {
                if (response.data.data.image) {
                  cacheMedia.images = [...(cacheMedia.images || []), {id:Date.now(),fileUrl:response.data.data.image,createdAt: Date.now()}];
                  console.log(cacheMedia)
                }
                    if (response.data.data.video) {
                  cacheMedia.videos = [...(cacheMedia.videos || []), {id:Date.now(),fileUrl:response.data.data.video,createdAt: Date.now()}];
                }
              }

            if(response.status==201){
                set({messageSendingLoading:false})
            }
        } catch (error) {
            console.log(error)
            set({messageSendingLoading:false})
        }
    },
    getAll_messages:async(receiverId)=>{
        try {
            set({messageLoading:true})
            const response=await axiosInstance.get(`/message/get_message/${receiverId}`);
            set({messages:response.data.data})
            if(response.status==200){
                set({messageLoading:false})
            }
        } catch (error) {
            console.log(error)
            set({messageLoading:false})
        }
    },
    subScribe:()=>{
        const socket=authStore.getState().socket;
        if(!socket)return
        //socket.off('newMessage'); // This is commented out!
        socket.off("deletedMessage")
        const{selectedUser}=get()
        socket.on('newMessage',(data)=>{
            if(data.sender==selectedUser||data.receiver==selectedUser){
                const {messages,cacheMedia}=get();
                set({messages:[...messages,data]})
                if (data.image || data.video) {
                    if (data.image) {
                      cacheMedia.images = [...(cacheMedia.images || []), data.image];
                    }
                        if (data.video) {
                      cacheMedia.videos = [...(cacheMedia.videos || []), data.video];
                    }
                  }
            }
        }) 

        socket.on("blocked",(data)=>{
            const authUser = authStore.getState().authUser;
            authStore.setState({ 
                authUser: {
                    ...authUser,
                    blockedBy: [...(authUser.blockedBy || []), data.from]
                } 
            });
        })
        socket.on("unBlocked",(data)=>{
            const authUser = authStore.getState().authUser;
            const updatedArray=authUser.blockedBy.filter(id =>id!=data.from )
            authStore.setState({ 
                authUser: {
                    ...authUser,
                    blockedBy: updatedArray
                } 
            });
        })

        //update the contact last scene for latest update of contact
        socket.on("new_Date",(data)=>{
            const {contacts}=get();
            const updated_contacts=contacts.map(contact=>{
                if(data.userId===contact.userId._id){
                   return {...contact,userId:{...contact.userId,lastSeen:data.newDate}}
                }
                return contact
            })
            set({contacts:updated_contacts})
        })

         socket.on("deletedMessage",(data)=>{
            const {messageId,deletedFor}=data;
            const {messages}=get();

            let updatedMessage=messages.map(message=>{
                if(message.id==messageId){
                    return {...message,deletedFor:deletedFor}
                }
                return message
            })
            set({messages:updatedMessage});
         })
    },
   notifyMessage: () => {
  const socket = authStore.getState().socket;
  if (!socket) return;
  const authUser = authStore.getState().authUser;
  // Remove any existing listeners for this event
  socket.off('newNotification');
  
  // Add the new listener
  socket.on('newNotification', (data) => {
    if (data.receiverId == authUser._id) {
      set((state) => {
        const existingIndex = state.notify.findIndex(
          (item) => item.senderId === data.sender
        );
  
        if (existingIndex !== -1) {
          const updatedNotify = [...state.notify];
          updatedNotify[existingIndex] = {
            ...updatedNotify[existingIndex],
            unseenCount: updatedNotify[existingIndex].unseenCount+1,
          };
          return { notify: updatedNotify };
        }
        else {
          return { 
            notify: [...state.notify, {
              senderId: data.sender, 
              unseenCount: 1
            }]
          }
        }
      });
    }
  });
  
}
,      
clear_notification:(contact_id)=>{
        set((state)=>{
            const updatedNotify=state.notify.filter(item=>item.senderId!=contact_id);
            return{notify:updatedNotify}
        })
},
unSubScribe:()=>{
    const socket=authStore.getState().socket;
    if(!socket)return
    socket.off('newMessage') // Make sure this is present and not commented
    socket.off("newNotification")
    socket.off("deletedMessage")
    socket.off("blocked");
    socket.off("unBlocked");


},
    setSelectedUser:(selectedUserId)=>{
        
        set({selectedUser:selectedUserId})
    },
    locallyUpdate_toSeen: async() => {
        try {
            const {messages} = get() // Remove the await here
            let update_message = messages.map(message => 
                 message.status != "seen" && message.isOwn
                ? {...message, status: "seen"} 
                : message
            )
            set({ messages: update_message });
        } catch (error) {
            console.log(error)
        }
    },
    get_Notify:async()=>{
        try {
            const response=await axiosInstance.get(`/message/notify`)
            set({notify:response.data.data})
        } catch (error) {
            console.log(error)
        }
    },
    deleteMessage:async(obj)=>{
        try {
            const response=await axiosInstance.put("/message/deleteMessage",obj);
            if(response.status===200){
                const {messages}=get();
                let updatedMessage=messages.map(message=>{
                    if (message.id === obj.messageId) {
                    return {...message,deletedFor:obj.arrayOfId}
                }
                return message
            });
                set({messages:updatedMessage})
            }
        } catch (error) {
          console.log(error)  
        }
    },

    forWardMessage:async(arrayOfMessage)=>{
        try {
            set({messageForwarding:true})

            const {messages}=get()
            const response=await axiosInstance.post(`/message/forwardMessage`,arrayOfMessage)
            console.log(response)
            if(response.status===200){
                if(response.data.data){
                set({messages:[...messages,response.data.data]})
                }
                set({messageForwarding:false})
            }

        } catch (error) {
            set({messageForwarding:false})

            console.log(error)
        }
    },

    getAllMedia:async(senderId,receiverId)=>{
        try {
            const {cacheMedia}=get();
            if(cacheMedia.images || cacheMedia.videos){
                set({ 
                    allContactImageMessages: cacheMedia.images || [],
                    allContactVideoMessages: cacheMedia.videos || [] 
                  })
            }
            else{
          set({mediaLoading:true})
            console.log(senderId,receiverId)
           const response=await axiosInstance.get(`/message/get_all_media/${senderId}/${receiverId}`);
            console.log(response)
            if(response.status===200){
                 set({ 
                    
                    allContactImageMessages: response.data.data.images || [],
                    allContactVideoMessages: response.data.data.videos || [] 
                  })
                  cacheMedia.images=response.data.data.images;
                  cacheMedia.videos=response.data.data.videos 
                set({mediaLoading:false})
            }
        }
        } catch (error) {
          set({mediaLoading:false})
          console.log(error)  
        }
    },
    // clear all message 
    delete_message:async(obj)=>{
        try {
            const response=await axiosInstance.put(`/message/clearAllMessage`,obj);
            if(response.status===200){
                set({messages:[]})
            }
        } catch (error) {
            console.log(error)
        }
    },
    blockUser:async(obj)=>{
        try {
          const {contacts}=get()
          const socket = authStore.getState().socket;
          const authUser=authStore.getState().authUser;
          const response=await axiosInstance.put(`/user/block_user`,obj);
          console.log(response)
          if(response.status===200){
            socket.emit("block",{to:obj.blockUserId,from:authUser._id})

            let updateContacts=contacts.map(contact=>{
                if(contact.userId._id===obj.blockUserId){
                    return {...contact,block:true}
                }
                return contact
            })
            set({contacts:updateContacts})
          } 
        } catch (error) {
          console.log(error)
        }
      },

      unBlockUser:async(obj)=>{
        try {
            const {contacts}=get()
            const socket = authStore.getState().socket;
            const authUser=authStore.getState().authUser;
            const response=await axiosInstance.put(`/user/unblock_user`,obj);
            if(response.status===200){
                socket.emit("unBlock",{to:obj.unblockedId,from:authUser._id})

                let updateContacts=contacts.map(contact=>{
                    if(contact.userId._id===obj.unblockedId){
                        return {...contact,block:false}
                    }
                    return contact
                })

                set({contacts:updateContacts})
            }
        } catch (error) {
      console.log(error) 
        }
      }
  
 
}))