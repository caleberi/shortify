import { applogger, passwordEncrypt, ObjectId, Router, User } from "../deps.ts";
import {
  checkForUserExistence,
  isAuthorized,
  login,
  parseIDParams,
  signup,
} from "../lib/auth/index.ts";
import {
  isAuthenticated,
  validateLoginCredentials,
  validatePassword,
} from "../lib/auth/index.ts";
import { Role } from "../lib/mongo/models/user.ts";
import { UserRepository } from "../lib/mongo/repo/user.repository.ts";

export default function (db: UserRepository) {
  const router = Router();

  // GET users listing.
  router.post(
    "/signup", 
    validatePassword,
    checkForUserExistence(db),
    signup(db)
  );

  router.post("/login", validateLoginCredentials, login(db));

  router.get(
    "/all", 
    isAuthenticated,
    isAuthorized(Role.ADMIN),
    async (req, res, next) => {
      let { page, limit } = {
        page: parseInt(req.query.page, 10) || 0,
        limit: parseInt(req.query.limit, 10) || 10,
      };
      let skips = page * (page * limit - 1);
      try {
        const users = await Promise.resolve(
          db
            .getCollection()
            .find()
            .skip(skips)
            .limit(page)
            .map((user) => user)
        );
        return res.setStatus(200).json({
          status: "SUCCESS",
          page: page,
          page_size: limit,
          data: users,
        });
      } catch (err) {
        res.setStatus(400).json({
          status: "FAILURE",
          err: err,
        });
      }
    }
  );
  router.get(
    "/count", //✅
    isAuthenticated,
    isAuthorized(Role.ADMIN),
    async (req, res, next) => {
      try {
        const count = await db.getCollection().countDocuments({});
        return res.setStatus(200).json({
          status: "SUCCESS",
          data: count,
        });
      } catch (err) {
        return res.setStatus(400).json({
          status: "FAILURE",
          err: err,
        });
      }
    }
  );
  router
    .route("/me") //✅
    .get(isAuthenticated, parseIDParams, async (req, res, next) => {
      try {
        const { id } = req.app.locals.user as any;
        const user = await db.findOne({ _id: new ObjectId(id) });
        applogger.debug(`Found User : ${JSON.stringify(user)}`);
        if (user) {
          delete user.password;
        }
        return res.setStatus(200).json({
          status: "SUCCESS",
          data: user,
        });
      } catch (err) {
        return res.setStatus(400).json({
          status: "FAILURE",
          err: err,
        });
      }
    })
    .put(
      isAuthenticated,
      parseIDParams,
      isAuthorized(Role.OWNER),
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const { username, email, avatarUrl } = req.body;
          const newUser = new User();
          newUser.email = email;
          newUser.username = username;
          newUser.profileImageUrl =
            avatarUrl ||
            "https://api.adorable.io/avatars/400/9996761c47427399e4fc968899fa8843.png";
          newUser.updatedAt = new Date();
            
          const doc = await db.updateOne({ _id: new ObjectId(id) }, {$set: newUser});
          return res.setStatus(200).json({
            status: "SUCCESS",
            data: doc,
          });
        } catch (err) {
          console.log(err);
          
          return res.setStatus(400).json({
            status: "FAILURE",
            err: err,
          });
        }
      }
    )
    .delete(
      isAuthenticated,
      parseIDParams,
      isAuthorized(Role.OWNER),
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const count = await db.deleteOne({ _id: new ObjectId(id) });
          return res.setStatus(200).json({
            status: "SUCCESS",
            data: count + " deleted",
          });
        } catch (err) {
          return res.setStatus(400).json({
            status: "FAILURE",
            err: err,
          });
        }
      }
    );

    router.put(
      '/me/update-password',
      isAuthenticated,
      parseIDParams,
      isAuthorized(Role.OWNER,Role.ADMIN),
      async (req, res, next) => {
        try {
          const { id } = req.params;
          const { password, confirmPassword } = req.body;

          if (password !== confirmPassword) {
            return res.setStatus(400).json({
              status: "FAILURE",
              message: "Password does not match for update to be made",
            });
          }

          const doc = await db.updateOne(
            { _id: new ObjectId(id) },
            { password: await passwordEncrypt(password as string,  Deno.env.get('SECRET_KEY') as string) }
          );
          return res.setStatus(200).json({
            status: "SUCCESS",
            data: doc,
          });
        } catch (err) {
          return res.setStatus(400).json({
            status: "FAILURE",
            err: err,
          });
        }
      }
    )
  router.delete(
    "/with-admin-right/:id",
    isAuthenticated,
    parseIDParams,
    isAuthorized(Role.ADMIN),
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const count = await db.deleteOne({ _id: new ObjectId(id) });
        return res.setStatus(200).json({
          status: "SUCCESS",
          data: count + " deleted",
        });
      } catch (err) {
        return res.setStatus(400).json({
          status: "FAILURE",
          err: err,
        });
      }
    }
  );
  return router;
}
