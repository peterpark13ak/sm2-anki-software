import React from "react";
import { shallow } from "enzyme";
import Footer from "./Footer";

it("renders without crashing", () => {
  const wrapper = shallow(<Footer />);
  expect(wrapper).toHaveLength(1);
});
