import * as Yup from 'yup';
import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Op } from 'sequelize';

import Meetup from '../models/Meetup';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const { date, page = 1 } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Invalid date' });
    }

    const searchDate = parseISO(date);
    const meetups = await Meetup.findAll({
      where: {
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
      limit: 10,
      include: [
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
      offset: (page - 1) * 10,
      order: ['date'],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      file_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    /**
     * Check for past dates
     */
    if (isBefore(startOfHour(parseISO(req.body.date)), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    const meetup = await Meetup.create({
      user_id: req.userId,
      ...req.body,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      file_id: Yup.number(),
      date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (isBefore(startOfHour(parseISO(req.body.date)), new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    if (req.userId !== meetup.user_id) {
      return res
        .status(401)
        .json({ error: 'Only the organizer can update the meetup' });
    }

    if (meetup.past) {
      return res.status(401).json({ error: 'You cant update past meetup' });
    }

    meetup.update(req.body);
    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(400).json({ error: 'Meetup not found' });
    }

    if (meetup.past) {
      return res.status(401).json({ error: 'You cant delete past meetup' });
    }

    if (req.userId !== meetup.user_id) {
      return res
        .status(401)
        .json({ error: 'Only the organizer can delete the meetup' });
    }

    await meetup.destroy();
    return res.send();
  }
}

export default new MeetupController();
