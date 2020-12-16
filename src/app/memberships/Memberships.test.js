import React from "react";
import { shallow } from "enzyme";
import Memberships from "./Memberships";

it("renders without crashing", () => {
  const wrapper = shallow(<Memberships />);
  expect(wrapper).toHaveLength(1);
});
