import {create} from "zustand"
import { axiosInstance } from "../lib/axios"


export const authStore=create((set)=>({
    authUser:null,
    isSigningUp:false,
    isLoginIng:false,
    isCheckingAuth:true,
    isAddContact:false,
    checkAuth:async()=>{
        try {
            set({})
            const response=await axiosInstance.get("/user/userInfo")
            set({authUser:response.data.data.user});
            
        } catch (error) {
            console.log(error)
            set({authUser:null})
        }
        finally{
            set({isCheckingAuth:false})
        }
    },
    login:async(formData)=>{
        try {
            set({isLoginIng:true})
          const response=await axiosInstance.post(`/user/login`,formData);
          if (response.data.statusCode === 200) {
            set({authUser:response.data.data})
            set({isLoginIng:false})
          }
        } catch (error) {
          console.log(error)
          set({ isLoggingIn: false });

        }
    },
    logout:async(navigate)=>{
        try {
            const response=await axiosInstance.get(`/user/logout`)
            if(response.data.statusCode==200){
                set({authUser:null})
                navigate("/login")
            }
          } catch (error) {
            console.log(error)
          }
    },
    addContact:async(formdata)=>{
        try {
            const response=await axiosInstance.post(`/user/contact`,formdata)
            if(response.data.statusCode===200){
                console.log("saved contact")
            }
        } catch (error) {
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
            console.log(error)
           }
    }
}))