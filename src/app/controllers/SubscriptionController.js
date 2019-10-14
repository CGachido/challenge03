import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';

class SubscriptionController {
  async store(req, res) {
    const user = User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.id, {
      include: [User],
    });

    if (meetup.user_id === user.id) {
      return res.status(400).json({
        error: 'You cant subscribe a meeting that you are organizing',
      });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'You cant subscribe to past meetups',
      });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: 'You cannot join two meetings at once' });
    }

    const subscription = await Subscription.create({
      meetup_id: meetup.id,
      user_id: user.id,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
