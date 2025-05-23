import {create} from "zustand"
import { axiosInstance } from "../lib/axios"

const API_URL = import.meta.env.VITE_DATA_BASE_LINK; // Your backend URL

export const groupStore=create((set,get)=>({
    isCreatingGroup:false,
    isGroupLoading:false,
    filterGroupArray:[],
    groupCache:{},
        groups:null,
    createGroup:async(formDta)=>{
        try {
            set({isCreatingGroup:true});
            const response=await axiosInstance.post(`/group/create_group`,formDta);
            console.log(response);
            if(response.status===201){
                set({isCreatingGroup:false});
            }
        } catch (error) {
            console.log(error)
            set({isCreatingGroup:false});

        }
    },
    get_all_group:async()=>{
        try {
            set({isGroupLoading:true})
            const response=await axiosInstance.get(`/group/get_all_group`);
           // console.log(response)
            if(response.status==200){
                set({isGroupLoading:false})
                set({groups:response.data.data});
              //  connection()
            }
        } catch (error) {
            set({isGroupLoading:false})
            console.log(error)
        }
    },
    filter_groups: async (query,activeTab) => {
        set({filterGroupLoading:true})
        const {groupCache}=get()
        const { groups } = get();
        try {
          if (activeTab==="groups") {
            let result=groupCache[query];
            if(result){
              set({ 
                filterGroupArray: result, 
            });
          
          set({filterGroupLoading:false})
            }
            else{
            const response = await axiosInstance.get(`/group/filterGroup?searchQuery=${query}`);
            if (response.status === 200) {
              const matchedUser = response.data.data;
              const filterGroup = groups.filter(group => {
            return matchedUser.some(user=>group.name === user.name)
              });
              
              set((state)=>(
                {groupCache:{
                  ...state.groupCache,[query]:filterGroup
                },
                
                  filterGroupArray: filterGroup, 
              }));
            }
            set({filterGroupLoading:false})
          }
        }
        } catch (error) {
            set({filterGroupLoading:false})

          console.log("Error filtering contacts:", error);
        }
    },

}))