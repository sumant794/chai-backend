class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode = statsuCode;
        this.data = data;
        this.message = message;
        this.success = statsuCode < 400;
    }
}