import axios from "axios"
import {create} from "zustand"
import { axiosInstance } from "../lib/axios"
const BASE_URL=import.meta.env.MODE
console.log(BASE_URL)

export const authStore=create((set)=>({
    authUser:null,
    isSigningUp:false,
    isLoginIng:false,
    isCheckingAuth:true,

    checkAuth:async()=>{
        try {
            const response=await axiosInstance.get("/user/userInfo")
            set({authUser:response.data});
        } catch (error) {
            console.log(error)
            set({authUser:null})
        }
        finally{
            set({isCheckingAuth:false})
        }
    }
}))