import { models } from '../models/Sequelize-mysql.js';

export const saveGig = async (req, res, next) => {
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
      res.status(201).json({ success: true, message: 'Gig saved successfully.', savedGig });
    } else {
      res.status(200).json({ success: true, message: 'Gig was already saved.', savedGig });
    }

  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        const err = new Error("Bad Request: Invalid Gig ID provided.");
        err.status = 400;
        return next(err);
    }
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

    res.status(204).send();

  } catch (error) {
    next(error);
  }
};

export const getSavedGigs = async (req, res, next) => {
  const currentUserClerkId = req.auth?.userId;

  if (!currentUserClerkId) {
    return res.status(401).json({ success: false, message: "Unauthorized: User ID not found." });
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
            'id', 'title', 'starting_price', 'delivery_time', 'seller_clerk_id',
            'gig_images', 'category_id', 'job_type_id', 'status', 'city', 'country', 'created_at'
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
              attributes: ['name'],
            },
          ],
        }
      ],
      limit: parseInt(limit, 10),
      offset,
      order: [['saved_date', 'DESC']]
    });

    const enrichedGigs = await Promise.all(savedGigsData.rows.map(async (sg) => {
      const gig = sg.Gig?.toJSON ? sg.Gig.toJSON() : sg.Gig;
      if (!gig) return null;

      if (gig.gig_images) {
        try { gig.gig_images = JSON.parse(gig.gig_images); } catch { gig.gig_images = []; }
      }

      gig.seller = {
        name: gig.seller?.firstname && gig.seller?.lastname
          ? `${gig.seller.firstname} ${gig.seller.lastname}`
          : gig.seller?.firstname || gig.seller?.username || 'Người dùng',
        avatar: gig.seller?.avatar || '/placeholder.svg',
      };

      const reviews = await models.Review.findAll({
        where: { gig_id: gig.id },
        attributes: ['rating'],
      });

      const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
      gig.rating = reviews.length ? totalStars / reviews.length : 0;
      gig.review_count = reviews.length;

      gig.badges = [];
      const createdAt = new Date(gig.created_at);
      const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      if (isNew) gig.badges.push("new");
      if (gig.id % 2 === 0) gig.badges.push("top_rated");

      if (gig.category && typeof gig.category === "object") {
        gig.category = {
          id: gig.category_id,
          name: gig.category.name || "Uncategorized"
        };
      }

      return gig;
    }));

    res.status(200).json({
      success: true,
      totalItems: savedGigsData.count,
      totalPages: Math.ceil(savedGigsData.count / parseInt(limit, 10)),
      currentPage: parseInt(page, 10),
      savedGigs: enrichedGigs.filter(Boolean),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching saved gigs', error: error.message });
  }
};