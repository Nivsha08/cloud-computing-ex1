const moment = require('moment');
const ParkingTicketManager = require('./parking-ticket-manager');

const router = require('express').Router();

const success = (body) => ({ status: 'success', data: { ...body } });
const failure = (message) => {
  console.error(message);
  return { status: 'failure', message };
};

router.post('/entry', async (req, res) => {
  const { plate, parkingLot } = req.query;

  if (!plate || !parkingLot) {
    res.status(400).send(failure('Invalid parameters: expected {plate} and {parkingLot}.'));
  }

  try {
    const ticketId = await ParkingTicketManager.createTicket(parkingLot, plate);
    res.status(200).send(success({ ticketId }));
  } catch (err) {
    res.status(500).send(failure(err));
  }
});

router.post('/exit', async (req, res) => {
  const { ticketId } = req.query;

  if (!ticketId) {
    res.status(400).send(failure('Invalid parameters: expected {ticketId}.'));
  }

  try {
    const { billedTicket, durationMinutes } = await ParkingTicketManager.endParking(ticketId);
    const { parking_lot_id, plate_number, total_cost } = billedTicket.Attributes ?? {};
    const foramttedDuration = moment.utc(moment.duration(Math.ceil(durationMinutes), 'm').as('ms')).format('HH:mm');

    res.status(200).send(
      success({
        parking_lot_id,
        plate_number,
        total_cost,
        total_duration_minutes: durationMinutes,
        formatted: {
          total_duration: foramttedDuration,
          total_cost: `$${total_cost.toFixed(2)}`
        }
      })
    );
  } catch (err) {
    res.status(500).send(failure(err));
  }
});

module.exports = router;
