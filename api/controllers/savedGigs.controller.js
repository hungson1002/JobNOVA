import { models } from '../models/Sequelize-mysql.js';

export const saveGig = async (req, res, next) => {
  const currentUserClerkId = req.auth?.userId;
  console.log("🧾 Current clerk ID:", req.auth?.userId);
  const gigId = req.params.gigId;

  if (!currentUserClerkId) {
    const error = new Error("Unauthorized: User ID not found.");
    error.status = 401;
    return next(error);
  }
  if (!gigId) {
    const error = new Error("Bad Request: Gig ID is required in URL parameter.");
    error.status = 400;
    return next(error);
  }

  try {
    const gigExists = await models.Gig.findByPk(gigId);
    if (!gigExists) {
      const error = new Error("Not Found: Gig not found.");
      error.status = 404;
      return next(error);
    }

    const [savedGig, created] = await models.SavedGig.findOrCreate({
      where: {
        clerk_id: currentUserClerkId,
        gig_id: gigId
      },
      defaults: {
        clerk_id: currentUserClerkId,
        gig_id: gigId,
        saved_date: new Date()
      }
    });

    if (created) {
      console.log(`User ${currentUserClerkId} saved gig ${gigId}`);
      res.status(201).json({ success: true, message: 'Gig saved successfully.', savedGig });
    } else {
      console.log(`User ${currentUserClerkId} attempted to save already saved gig ${gigId}`);
      res.status(200).json({ success: true, message: 'Gig was already saved.', savedGig });
    }

  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        const err = new Error("Bad Request: Invalid Gig ID provided.");
        err.status = 400;
        return next(err);
    }
    console.error('Error saving gig:', error.message);
    next(error);
  }
};

export const unsaveGig = async (req, res, next) => {
  const currentUserClerkId = req.auth?.userId;
  const gigId = req.params.gigId;

  if (!currentUserClerkId) {
    const error = new Error("Unauthorized: User ID not found.");
    error.status = 401;
    return next(error);
  }
  if (!gigId) {
    const error = new Error("Bad Request: Gig ID is required in URL parameter.");
    error.status = 400;
    return next(error);
  }

  try {
    const result = await models.SavedGig.destroy({
      where: {
        clerk_id: currentUserClerkId,
        gig_id: gigId
      }
    });

    if (result === 0) {
      const error = new Error("Not Found: Saved gig entry not found for this user and gig ID.");
      error.status = 404;
      return next(error);
    }

    console.log(`User ${currentUserClerkId} unsaved gig ${gigId}`);
    res.status(204).send();

  } catch (error) {
    console.error('Error unsaving gig:', error.message);
    next(error);
  }
};

export const getSavedGigs = async (req, res, next) => {
  const currentUserClerkId = req.auth?.userId;

  if (!currentUserClerkId) {
    const error = new Error("Unauthorized: User ID not found.");
    error.status = 401;
    return next(error);
  }

  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const savedGigsData = await models.SavedGig.findAndCountAll({
      where: { clerk_id: currentUserClerkId },
      include: [
        {
          model: models.Gig,
          attributes: [
            'id',
            'title',
            'starting_price',
            'delivery_time',
            'gig_image',
            'seller_clerk_id',
            'gig_images',
            'category_id',
            'job_type_id',
            'status',
            'city',
            'country',
          ],
          include: [
            {
              model: models.User,
              as: 'seller',
              attributes: ['firstname', 'lastname', 'username', 'clerk_id', 'avatar'],
            },
            {
              model: models.Category,
              as: 'category',
              attributes: ['id', 'name'],
            },
            {
              model: models.JobType,
              as: 'job_type',
              attributes: ['id', 'job_type'],
            },
          ],
        }
      ],
      limit: parseInt(limit, 10),
      offset: offset,
      order: [['saved_date', 'DESC']]
    });

    res.status(200).json({
      success: true,
      totalItems: savedGigsData.count,
      totalPages: Math.ceil(savedGigsData.count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      savedGigs: savedGigsData.rows.map(sg => {
        const gig = sg.Gig?.toJSON ? sg.Gig.toJSON() : sg.Gig;
        if (gig && gig.gig_images) {
          try { gig.gig_images = JSON.parse(gig.gig_images); } catch { gig.gig_images = []; }
        }
        if (gig && gig.seller) {
          gig.seller = {
            name: gig.seller.firstname && gig.seller.lastname
              ? gig.seller.firstname + ' ' + gig.seller.lastname
              : gig.seller.firstname
              ? gig.seller.firstname
              : gig.seller.username
              ? gig.seller.username
              : 'Người dùng',
            avatar: gig.seller.avatar || '/placeholder.svg',
          };
        } else if (gig) {
          gig.seller = {
            name: 'Người dùng',
            avatar: '/placeholder.svg',
          };
        }
        return gig;
      })
    });

  } catch (error) {
    console.error('Error fetching saved gigs:', error.message);
    next(error);
  }
};