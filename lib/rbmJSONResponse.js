/**
 * Created by richardbrash on 3/10/15.
 */

function rbmJSONResponse(){

    this.successResponse = function(data){

        var response = {
            success:true,
            data : data,
            error: null
        };

        return response;

    }

    this.errorResponse = function(error){

        var response = {
            success:false,
            data : null,
            error: error.message
        };

        return response;

    }

}



module.exports = new rbmJSONResponse();