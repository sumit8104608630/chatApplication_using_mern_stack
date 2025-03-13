class apiError extends Error{
    constructor(
        message = 'Some thing went wrong',
        statusCode,
        error=[],
        stack=""
    ){
        super(message);
        this.statusCode=statusCode;
        this.error=error;
        this.data=null;
        this.success=false
        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}

export {apiError}