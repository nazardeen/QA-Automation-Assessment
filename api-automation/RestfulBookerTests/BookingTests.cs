using System.Net;
using System.Threading.Tasks;
using RestfulBookerTests.ApiClients;
using FluentAssertions;
using Xunit;
using System.Text.Json;

namespace RestfulBookerTests
{
    public class BookingTests
    {
        private readonly RestfulBookerApi _api;
        private int _bookingId;

        public BookingTests() 
        {
            _api = new RestfulBookerApi();
        }

        [Fact]
        public async Task HealthCheck_ShouldReturnSuccess()
        {
            var response = await _api.HealthCheck();
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            response.Content.Should().Contain("Created");
        }

        // [Fact]
        // public async Task EnsureAuthToken_ShouldRetrieveAndStoreToken()
        // {

        //     await _api.GetBooking(1); 

        //     string? token = _api.GetStoredAuthToken();
        //     Console.WriteLine("DEBUG: Retrieved Auth Token -> " + token);


        //     token.Should().NotBeNullOrEmpty("Auth token should not be null or empty");
        //     token.Should().MatchRegex("^[a-zA-Z0-9]+$", "Auth token should contain only alphanumeric characters");
        // }



        [Fact]
        public async Task CreateBooking_ShouldReturnSuccessAndBookingId()
        {
            var bookingDetails = new
            {
                firstname = "John",
                lastname = "Doe",
                totalprice = 250,
                depositpaid = true,
                bookingdates = new { checkin = "2025-03-01", checkout = "2025-03-05" },
                additionalneeds = "Breakfast"
            };

            var response = await _api.CreateBooking(bookingDetails);

            //Used below whilst debugging for errors
            // Console.WriteLine("DEBUG: Response Status Code -> " + response.StatusCode);
            // Console.WriteLine("DEBUG: Response Headers -> " + response.Headers);
            // Console.WriteLine("DEBUG: Response Body -> " + response.Content);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Should().Contain("bookingid");
            _bookingId = int.Parse(response.Content.Split(":")[1].Split(",")[0]);
        }
        [Fact]
        public async Task GetBooking_ShouldReturnCorrectDetails()
        {
            await CreateBooking_ShouldReturnSuccessAndBookingId();

            var response = await _api.GetBooking(_bookingId);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Should().Contain("John");
            response.Content.Should().Contain("Doe");
        }
        
        [Fact]
        public async Task UpdateBooking_ShouldModifyBookingCorrectly()
        {
            await CreateBooking_ShouldReturnSuccessAndBookingId();

            var updatedDetails = new
            {
                firstname = "James",
                lastname = "Smith",
                totalprice = 300,
                depositpaid = false,
                bookingdates = new { checkin = "2025-04-01", checkout = "2025-04-07" },
                additionalneeds = "Lunch"
            };

            var response = await _api.UpdateBooking(_bookingId, updatedDetails);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Should().Contain("James");
            response.Content.Should().Contain("Smith");
        }


        [Fact]
        public async Task PartialUpdateBooking_ShouldModifyOnlySpecifiedFields()
        {
            await CreateBooking_ShouldReturnSuccessAndBookingId(); 

            var patchDetails = new
            {
                firstname = "Michael",
                lastname = "Brown"
            };

            var response = await _api.PartialUpdateBooking(_bookingId, patchDetails);

            // Console.WriteLine("DEBUG: Response Status Code -> " + response.StatusCode);
            // Console.WriteLine("DEBUG: Response Headers -> " + response.Headers);
            // Console.WriteLine("DEBUG: Response Body -> " + response.Content);

            response.StatusCode.Should().Be(HttpStatusCode.OK);
            response.Content.Should().Contain("Michael");
            response.Content.Should().Contain("Brown");
        }   
        [Fact]
        public async Task DeleteBooking_ShouldRemoveBooking()
        {

            await CreateBooking_ShouldReturnSuccessAndBookingId();

            var deleteResponse = await _api.DeleteBooking(_bookingId);


            Console.WriteLine("DEBUG: Delete Response Status Code -> " + deleteResponse.StatusCode);
            Console.WriteLine("DEBUG: Delete Response Body -> " + deleteResponse.Content);

            deleteResponse.StatusCode.Should().Be(HttpStatusCode.Created); 


            var getResponse = await _api.GetBooking(_bookingId);
            
            Console.WriteLine("DEBUG: Get Response After Deletion -> " + getResponse.StatusCode);
            
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetToken_ShouldReturnValidToken()
        {
            var response = await _api.Authenticate();
            
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            response.Content.Should().NotBeNullOrEmpty("Auth API response should not be null or empty");
            
            var tokenJson = JsonSerializer.Deserialize<Dictionary<string, string>>(response.Content!)!;
            tokenJson.Should().ContainKey("token", "Auth response should contain a token field");
            
            string token = tokenJson["token"];
            token.Should().NotBeNullOrEmpty("Auth token should not be null or empty");
            token.Should().MatchRegex("^[a-zA-Z0-9]+$", "Auth token should be alphanumeric");
            
            string? storedToken = _api.GetStoredAuthToken();
            storedToken.Should().NotBeNullOrEmpty("Stored token should not be null or empty");
            storedToken.Should().Be(token, "Token should be stored after authentication");
        }



    }
}
