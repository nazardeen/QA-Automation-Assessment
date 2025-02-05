using RestSharp;
using System.Threading.Tasks;
using System.Text.Json;

namespace RestfulBookerTests.ApiClients
{
    public class RestfulBookerApi
    {
        private readonly RestClient _client;
        private readonly string _baseUrl = "https://restful-booker.herokuapp.com";
        private string? _authToken;  

        public RestfulBookerApi()
        {
            _client = new RestClient(_baseUrl);
        }

        public async Task<RestResponse> CreateBooking(object bookingDetails)
        {
            var request = new RestRequest("/booking", Method.Post);
            
            request.AddHeader("Accept", "application/json"); 
            request.AddHeader("Content-Type", "application/json"); 

            request.AddJsonBody(bookingDetails);

            return await _client.ExecuteAsync(request);
        }

        public async Task<RestResponse> GetBooking(int bookingId)
        {
            var request = new RestRequest($"/booking/{bookingId}", Method.Get);
            request.AddHeader("Accept", "application/json");
            return await _client.ExecuteAsync(request);
        }

        public async Task<RestResponse> UpdateBooking(int bookingId, object updatedDetails)
        {
            await EnsureAuthToken(); 

            var request = new RestRequest($"/booking/{bookingId}", Method.Put);
            
            request.AddHeader("Accept", "application/json");
            request.AddHeader("Content-Type", "application/json");

            if (!string.IsNullOrEmpty(_authToken))
            {
                request.AddHeader("Cookie", $"token={_authToken}");
            }

            request.AddJsonBody(updatedDetails);
            return await _client.ExecuteAsync(request);
        }

        public async Task<RestResponse> PartialUpdateBooking(int bookingId, object patchDetails)
        {
            await EnsureAuthToken(); 

            var request = new RestRequest($"/booking/{bookingId}", Method.Patch);
            
            request.AddHeader("Accept", "application/json");
            request.AddHeader("Content-Type", "application/json");

            if (!string.IsNullOrEmpty(_authToken))
            {
                request.AddHeader("Cookie", $"token={_authToken}");
            }

            string jsonBody = JsonSerializer.Serialize(patchDetails); 
            request.AddStringBody(jsonBody, ContentType.Json);

            return await _client.ExecuteAsync(request);
        }


        public async Task<RestResponse> DeleteBooking(int bookingId)
        {
            await EnsureAuthToken(); 

            var request = new RestRequest($"/booking/{bookingId}", Method.Delete);

            if (!string.IsNullOrEmpty(_authToken))
            {
                request.AddHeader("Cookie", $"token={_authToken}");
            }

            return await _client.ExecuteAsync(request);
        }

        public async Task<RestResponse> HealthCheck()
        {
            var request = new RestRequest("/ping", Method.Get);
            return await _client.ExecuteAsync(request);
        }

        private async Task EnsureAuthToken()
        {
            if (string.IsNullOrEmpty(_authToken)) 
            {
                _authToken = await CreateToken();
            }
        }
        public string? GetStoredAuthToken()
        {
            return _authToken;
        }
        private async Task<string?> CreateToken()
        {
            var request = new RestRequest("/auth", Method.Post);
            request.AddHeader("Content-Type", "application/json");
            request.AddJsonBody(new { username = "admin", password = "password123" });

            var response = await _client.ExecuteAsync(request);

            if (string.IsNullOrWhiteSpace(response.Content))
            {
                Console.WriteLine("DEBUG: Auth API returned an empty response.");
                return null;
            }

            try
            {
                var jsonResponse = JsonSerializer.Deserialize<Dictionary<string, string>>(response.Content);
                return jsonResponse != null && jsonResponse.ContainsKey("token") ? jsonResponse["token"] : null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: Error parsing auth token response: {ex.Message}");
                return null;
            }
        }
    }
}
