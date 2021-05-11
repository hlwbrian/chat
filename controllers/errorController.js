const AppError = require('./../utils/appError');

const handleDupDB = err => {
    let output;
    const duplicatedItems = Object.keys(err.keyValue);
    for(let fieldName of duplicatedItems){
        output = fieldName + ' ';
    }
    
    const message = `Value(s) are used, please use another value for : ${output}`;
    return new AppError(message, 400);
}

const sendErrorDev = (err, req, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }else{
        console.log('Unexpected server error from error control');

        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    let error = {...err};

    //Check duplicated field value
    if(error.code === 11000) error = handleDupDB(error);
    if(process.env.ENVIRONMENT === 'dev'){
        sendErrorDev(error, req, res);
    }else{      
        sendErrorProd(error, res);
    }
}