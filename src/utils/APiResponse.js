class ApiResponse {
    constructor(statsuCode, data, message = "Succes"){
        this.statusCode = statsuCode;
        this.data = data;
        this.message = message;
        this.success = statsuCode < 400;
    }
}