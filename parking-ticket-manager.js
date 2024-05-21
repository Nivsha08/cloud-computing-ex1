const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { db } = require('./database');

const TABLE_NAME = 'parking_ticket';

const HOURLY_RATE = 10;
const BILLING_PERIOD_FRAC = 0.25;
const BILLING_PERIOD_RATE = BILLING_PERIOD_FRAC * HOURLY_RATE;

class ParkingTicketManager {
  static getTicketById = async (ticketId) => {
    return await db
      .get({
        TableName: TABLE_NAME,
        Key: { ticket_id: ticketId }
      })
      .promise();
  };

  static getPreviousTicketsForPlate = async (plateNumber) => {
    return await db
      .scan({
        TableName: TABLE_NAME,
        FilterExpression: 'plate_number = :plate_number',
        ExpressionAttributeValues: { ':plate_number': plateNumber }
      })
      .promise();
  };

  static createTicket = async (parkingLotId, plateNumber) => {
    const ticketId = uuidv4();
    const previousTickets = await ParkingTicketManager.getPreviousTicketsForPlate(plateNumber);
    console.info({ previousTickets, item: previousTickets.Items?.[0] });
    const isCurrentlyParking = previousTickets.Items?.some((item) => !item.exit_timestamp);

    if (isCurrentlyParking) {
      throw `Plate number ${plateNumber} is currently parking.`;
    }

    await db
      .put({
        TableName: TABLE_NAME,
        Item: {
          ticket_id: ticketId,
          entry_timestamp: Date.now(),
          parking_lot_id: parkingLotId,
          plate_number: plateNumber,
          exit_timestamp: null,
          total_cost: null
        }
      })
      .promise();

    return Promise.resolve(ticketId);
  };

  static endParking = async (ticketId) => {
    const parkingTicket = await ParkingTicketManager.getTicketById(ticketId);
    const { entry_timestamp: entryTime, exit_timestamp } = parkingTicket.Item ?? {};

    if (!parkingTicket?.Item) {
      throw `A ticket with id ${ticketId} does not exist.`;
    }

    if (!!exit_timestamp) {
      throw `The parking for ticket id ${ticketId} was already billed.`;
    }

    const exitTime = Date.now();
    const duration = moment.duration(exitTime - entryTime, 'ms');
    const durationMinutes = duration.asMinutes();
    const billingPeriods = Math.ceil(durationMinutes / (BILLING_PERIOD_FRAC * 60));
    const totalCost = BILLING_PERIOD_RATE * billingPeriods;

    // update DB record with exit timestamp and total cost
    const billedTicket = await db
      .update({
        TableName: TABLE_NAME,
        ReturnValues: 'ALL_NEW',
        Key: { ticket_id: ticketId },
        UpdateExpression: 'SET exit_timestamp = :exit, total_cost = :cost',
        ExpressionAttributeValues: {
          ':exit': exitTime,
          ':cost': totalCost
        }
      })
      .promise();

    return { billedTicket, durationMinutes };
  };
}

module.exports = ParkingTicketManager;
