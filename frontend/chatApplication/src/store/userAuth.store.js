import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
import {io} from "socket.io-client"
import { messageStore } from "./message.store";
import { groupStore } from "./group.store";
const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const authStore=create((set,get)=>({
    activeUser:[],
    loginError:null,
    authUser:null,
    get_online_user:[],
    isSigningUp:false,
    isLoginIng:false,
    isCheckingAuth:true,
    isAddContact:false,
    addContactLoading:false,
    isUpdatingProfile:false,
    socket:null,
    checkAuth:async()=>{
        try {
            const response=await axiosInstance.get("/user/userInfo")
            set({authUser:response.data.data.user});
            get().connection()
        } catch (error) {
            console.log(error)
            set({authUser:null})
        }
        finally{
            set({isCheckingAuth:false})
        }
    },
    login: async (formData) => {
      try {
        const get_all_group=groupStore.getState().get_all_group;
        const update_message=messageStore.getState().update_message_array_received
        set({ isLoginIng: true }) // Use consistent property name
        const response = await axiosInstance.post(`/user/login`, formData);
        if (response.data.statusCode === 200) {
          update_message(response.data.data._id)
          set({ authUser: response.data.data })
          get_all_group()
          get().connection()
        }
        set({ isLoginIng: false }) // Use consistent property name
      } catch (error) {
        set({loginError:error.response.data.message})
        if (error) {
          set({ isLoginIng: false }); // Fix property name
        }
      } finally {
        set({ isLoginIng: false }); // Fix property name
      }
    },
    logout:async(navigate)=>{
        try {
            const response=await axiosInstance.get(`/user/logout`)
            if(response.data.statusCode==200){
                set({authUser:null})
                get().disconnection()
                navigate("/login")
            }
          } catch (error) {
            console.log(error)
          }
    },
    addContact:async(formdata,navigate)=>{
        try {
          set({addContactLoading:true})
            const response=await axiosInstance.post(`/user/contact`,formdata)
            if(response.data.statusCode===201){
              set({addContactLoading:false})
              navigate("/")

                console.log("saved contact")
            }
        } catch (error) {
          set({addContactLoading:false})

            console.log(error)
        }
    },

    signUp:async(formData,navigate)=>{
           try {
             const uploadData = new FormData();
          uploadData.append("name", formData.name);
          uploadData.append("phoneNumber", formData.phoneNumber);
          uploadData.append("email", formData.email);
          uploadData.append("password", formData.password);
          if (formData.profilePhoto) {
            uploadData.append("profilePhoto", formData.profilePhoto);
          }
          set({isSigningUp:true})
          const response=await axiosInstance.post(`/user/register`,uploadData);
             console.log(response.data);
             if(response.data.statusCode==201){
                set({isSigningUp:false})
                navigate("/login")
             }
           } catch (error) {
            set({isSigningUp:false})
            console.log(error)
           }
    },
    updateProfile:async(formData)=>{
      try {
        set({isUpdatingProfile:true})
        const response=await axiosInstance.put(`/user/update_profile`,formData);
        set((prev)=>({...prev,...response.data.data}))
        set({isUpdatingProfile:false})

        return response
      } catch (error) {
        console.log(error)
      }
      finally{
        set({isUpdatingProfile:false})
      }
    },
    // let's create socket.io connect method
    connection: async() => {
      try {
        const {authUser} = get()
        if (!authUser || get().socket?.connected) return;
        
        const socket = io(API_URL, {
          query: { userId: authUser._id,
//            transports: ['websocket']
           }
        })
        
        // Listen for the onlineUser event
        socket.on("onlineUser", (onlineUsers) => {
          set({ get_online_user: onlineUsers })
        })

        set({ socket: socket })
    
        return socket
      } catch (error) {
        console.log(error)
        return null
      }
    },
    disconnection:async()=>{
      try {
        if(get().socket?.connected)get().socket.disconnect();
      } catch (error) {
        console.log(error)
      }
    },
    // let's create method in which we say that which one we click on usr
    selectUser:async(connect_id,authUserId)=>{
      try {
        const socket = io(API_URL, {
          query: { selected_id: connect_id , authUserId: authUserId}

        });
    get().getActiveUser()
      } catch (error) {
        console.log(error)
      }
    },
  getActiveUser: async() => {
  try {
    const { socket } = get();
    console.log("Socket available:", !!socket);
    if (!socket) return;
    socket.on("getActiveUser", (activeUser) => {
      console.log("Received activeUser data:", activeUser);
      try { 
        set({ activeUser: activeUser });
        console.log("State updated successfully");
      } catch (error) {
        console.log("Error in set function:", error);
      }
    });
  } catch (error) {
    console.log("Error in getActiveUser:", error);
  }
} ,
    
deleteActiveUser: async(userIdObj) => {
  if (!userIdObj || !userIdObj.authUserId || !userIdObj.selectedId) {
    console.error('Invalid user object for deletion', userIdObj);
   return
  }
  const {socket} = get();
  socket.emit('delete_active_user', userIdObj);
}
,

delete_authUserMatchId:async(userId)=>{
  console.log(userId)
      const {socket}=get();
      socket.emit('delete_authUserMatchId',userId);
    }




}))