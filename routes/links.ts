import { errorlogger } from "../container.ts";
import {
  applogger,
  AuthorizationError,
  base64Encode,
  extractValidationErrorMessage,
  isNull,
  Link,
  ObjectId,
  Router,
  validate,
  ValidationError,
} from "../deps.ts";
import { isAuthenticated } from "../lib/auth/index.ts";
import { LinkRepository } from "../lib/mongo/repo/link.repository.ts";
import { UserRepository } from "../lib/mongo/repo/user.repository.ts";
import { getId } from "../lib/utils/helpers.ts";

export default function (udb:UserRepository,ldb: LinkRepository) {
  const router = Router({ mergeParams: true });

  router.get("/all", isAuthenticated, async (req, res, next) => {
    let user = req.app.locals.user as any;
    let { page, limit } = {
      page: parseInt(req.query.page, 10) || 0,
      limit: parseInt(req.query.limit, 10) || 10,
    };
    let skips = page * (page * limit - 1);
    try {
      const links = await Promise.resolve(
        ldb
          .getCollection()
          .find({ userId: new ObjectId(user.id) })
          .skip(skips)
          .limit(page)
          .map((link) => link)
      );
      return res.setStatus(200).json({
        status: "SUCCESS",
        page: page,
        page_size: limit,
        data: links,
      });
    } catch (err) {
      res.setStatus(400).json({
        status: "FAILURE",
        err: err,
      });
    }
  });

  router.route("/").post(isAuthenticated, async (req, res, next) => {
    try {
      let user = req.app.locals.user as any;
      let { longUrl, siteName } = req.body;
      if (
        !longUrl ||
        !/(https?:\/\/)?([\da-z\.-]+)\.([a-z]{2,6})([\/\w\.-]*)*\/?/g.test(
          longUrl
        )
      ) {
        return new ValidationError("A url to be shortened must be added ");
      }
      let link = new Link();
      link.shortId = getId();
      link.longUrl = longUrl;
      link.siteName = siteName;
      link.userId = new ObjectId(user.id);

      const errors = await validate(link, {
        validationError: { target: false },
      });

      if (errors.length > 0) {
        return res.setStatus(400).json({
          status: "FAILURE",
          error: extractValidationErrorMessage(errors),
        });
      }

      const slink = await ldb.create(link);

      if (isNull(slink)) {
        return res.setStatus(401).json({
          status: "FAILURE",
          message: "Could not create user",
        });
      }
      applogger.info(`Created a vault with id : [${slink}] 🐙`);
      return res.setStatus(201).jsonp({
        status: "SUCCESS",
        message: `Created a vault with id : [${slink}] 🐙`,
      });
    } catch (err) {
      return res.setStatus(500).json({ status: "FAILURE", err });
    }
  });

  router
    .route("/:id")
    .get(isAuthenticated, async (req, res, next) => {
      try {
        let { id } = req.params;
        let { id: userId } = req.app.locals.user as any;
        if (!userId) {
          throw new AuthorizationError("User not found 🔎");
        }
        const link = await ldb.findOne({
          userId: new ObjectId(userId),
          _id: new ObjectId(id),
        });

        if (link) {
          return res.setStatus(200).json({
            status: "SUCCESS",
            data: link,
          });
        }
        return res.setStatus(400).json({
          status: "FAILURE",
          data: {},
        });
      } catch (err) {
        errorlogger.error(err);
        return res.setStatus(500).json({ status: "FAILURE", err });
      }
    })
    .delete(async (req, res, next) => {
      try {
        let { id } = req.params;
        let { id: userId } = req.app.locals.user as any;
        if (!userId) {
          throw new AuthorizationError("User not found 🔎");
        }
        const result = await ldb.deleteOne({
          _id: new ObjectId(id),
          userId: new ObjectId(userId),
        });
        return res.setStatus(201).jsonp({
          status: "SUCCESS",
          message: `Number : [${result}] deleted 🐙`,
        });
      } catch (err) {
        return res.setStatus(500).json({ status: "FAILURE", err });
      }
    });
  return router;
}
