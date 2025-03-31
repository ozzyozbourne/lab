import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);
const tableName = "MyAirportTable";

export const handler = async (event, context) => {
    let body;
    let statusCode = 200;
    const headers = { "Content-Type": "application/json", };
    try {
        switch (event.routeKey) {
            case "GET /airport/{airport}":
                body = await dynamo.send(
                    new QueryCommand({
                        TableName: tableName, // this is the name of the table that is parameterized 
                        KeyConditionExpression: "airport = :airport", // this is the query 
                        ExpressionAttributeValues: {
                            ":airport": event.pathParameters.airport, // this is where we get the output of the query from the path params
                        }
                    })
                );
                break;
            case "POST /airport":
                let requestJSON = JSON.parse(event.body);
                await dynamo.send(
                    new PutCommand({
                        TableName: tableName,
                        Item: {
                            airport: requestJSON.airport,
                            name: requestJSON.name,
                            latitude: requestJSON.latitude,
                            longitude: requestJSON.longitude
                        },
                    })
                );
                break;
            default:
                body = `Put item ${requestJSON.airport}`;
                throw new Error(`Unsupported route: "${event.routeKey}"`);
        }
    } catch (err) {
        statusCode = 400;
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }
    return {
        statusCode,
        body,
        headers,
    };
};
