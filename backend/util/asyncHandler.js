
const asyncHandler=(functions)=>{
    return (req,res,next)=>{
     Promise.resolve(functions(req,res,next)).catch((err)=>next(err));
   }
   }
   
   export{
       asyncHandler
   } 