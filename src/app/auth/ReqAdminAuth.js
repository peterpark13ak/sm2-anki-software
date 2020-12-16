import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import isAuthenticated from "../../helpers/isAuthenticated";
import cookie from "js-cookie";
import { ADMIN_ID } from '../../config.js'

const ReqAdminAuth = ComposedComponent => {
  class Authentication extends Component {
    render() {
      const user = cookie.getJSON("user");
      const email = user ? user['email'] : "";

      if (!isAuthenticated() || email !== ADMIN_ID) {
        return <Redirect to="/" />;
      }
      return <ComposedComponent {...this.props} />;
    }
  }

  return Authentication;
};

export default ReqAdminAuth;
