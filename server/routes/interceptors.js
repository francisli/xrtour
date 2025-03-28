import bcrypt from 'bcrypt';
import passport from 'passport';
import passportLocal from 'passport-local';
import { StatusCodes } from 'http-status-codes';

import models from '../models/index.js';

/* eslint-disable no-param-reassign, no-underscore-dangle */
function SessionManager(options, serializeUser) {
  if (typeof options === 'function') {
    serializeUser = options;
    options = undefined;
  }
  options = options || {};
  this._key = options.key || 'passport';
  this._serializeUser = serializeUser;
}

SessionManager.prototype.logIn = function logIn(req, user, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  const self = this;
  this._serializeUser(user, req, (err, obj) => {
    if (err) {
      cb(err);
      return;
    }
    if (!req.session) {
      req.session = {};
    }
    if (!req.session[self._key]) {
      req.session[self._key] = {};
    }
    req.session[self._key].user = obj;
    cb();
  });
};

SessionManager.prototype.logOut = function logOut(req, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }
  options = options || {};
  if (req.session && req.session[this._key]) {
    delete req.session[this._key].user;
  }
  if (cb) {
    cb();
  }
};
/* eslint-enable no-param-reassign */

passport._sm = new SessionManager(passport.serializeUser.bind(passport));

passport.use(
  new passportLocal.Strategy(
    {
      usernameField: 'email',
    },
    (email, password, done) => {
      let user;
      models.User.findOne({ where: { email } })
        .then((result) => {
          user = result;
          return user.getMemberships({
            include: 'Team',
            order: [['Team', 'name', 'ASC']],
          });
        })
        .then((result) => {
          user.Memberships = result;
          bcrypt
            .compare(password, user.hashedPassword)
            .then((res) => {
              if (res) {
                return done(null, user);
              }
              return done(null, false, { message: 'Invalid password' });
            })
            .catch(() => done(null, false, { message: 'Invalid password' }));
        })
        .catch(() => done(null, false, { message: 'Invalid login' }));
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((req, id, done) => {
  models.User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      req.session = null;
      done(error);
    });
});

function sendErrorUnauthorized(req, res) {
  res.sendStatus(StatusCodes.UNAUTHORIZED);
}

function sendErrorForbidden(req, res) {
  res.sendStatus(StatusCodes.FORBIDDEN);
}

function requireLoginInternal(req, res, next, requireAdmin) {
  if (req.user) {
    if (requireAdmin) {
      if (req.user.isAdmin) {
        next();
      } else {
        sendErrorForbidden(req, res);
      }
    } else {
      next();
    }
  } else {
    sendErrorUnauthorized(req, res);
  }
}

function requireLogin(req, res, next) {
  requireLoginInternal(req, res, next, false);
}

function requireAdmin(req, res, next) {
  requireLoginInternal(req, res, next, true);
}

export default {
  passport,
  requireLogin,
  requireAdmin,
};
