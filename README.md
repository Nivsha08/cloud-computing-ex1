## Cloud Computing - Ex1 submission docs

### Contents
#### Server and interface
* The API interface, under `parking.js`.
* A parking tickets service containing the 
parking business logic, under `parking-ticket-manager`.
#### Peripherals
* `index.js` - initializes the server and basic env config.
* `database.js` - initializes a DB connection.
* A `deploy.ts` script.
* An `.env-template` file with a boilerplate for the required env parameters for allowing proper AWS deployments and connections.
---

### Stack
#### Server
* The service is served from an AWS Lambda function, as a lean Node.js server (using Express). This solution was chosen over a more comprehensive EC2 instance due to the very concised functionality the server needs to provide.
* The endpoints are triggered through an AWS API Gateway proxy. 

#### Data persistence
The data is managed using AWS DynamoDB with a single table.

---

### Lambda deployment
The deployment script installs the necessary server dependencies, compresses them and uploads them to the hosting AWS Lambda functio. 

In the root folder, run:
```
npm run deploy
```

---

### Usage
Starting parking:
```
POST /entry?parkingLot=1&plate=123456789

{ 
    status: "success", 
    data: { ticketId: "123" }
}
-- OR --
{ 
    status: "failure",
    message: "Plate {plate_number} is currently parking"
}
```

End parking:
```
POST /exit?ticketId=123

{ 
    status: "success", 
    data: { 
        "parking_lot_id": "1",
        "plate_number": "123456789",
        "total_cost": 12.5,
        "total_duration_minutes": 65.6250,
        "formatted": {
            "total_duration": "01:06",
            "total_cost": "$12.50"
        }
    }
}
-- OR --
{
    status: "failure",
    message: 
        "A ticket with id {ticket_id} does not exist." |
        "The parking for ticket id {ticket_id} was already billed."
}
```