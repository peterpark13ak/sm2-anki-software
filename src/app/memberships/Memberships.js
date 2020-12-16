import React, { Component } from "react";
import { Header, Button, Input, Grid, Icon, Label, Menu, Table, Checkbox } from "semantic-ui-react";
import cookie from "js-cookie";
import * as api from "./membershipsActions";

import withErrors from "../../helpers/withErrors";

const EmptyView = ({
  title,
  description,
  emoji = "✌️",
}: {
  title: string,
  description: string,
  emoji?: string,
}) => (
  <div className="text-center ml-auto mr-auto my-5">
    <div className="text-center">
      <div className="row">
        <div className="col-md-6 offset-md-3">
          <Header size="large">
            {emoji} {title}
            <Header.Subheader className="text-secondary" style={{ lineHeight: "1.4em" }}>
              {description}
            </Header.Subheader>
          </Header>
        </div>
      </div>
    </div>
  </div>
);

class Memberships extends Component {
  state = {
    decks: [],
    plans: [],
    isLoading: true
  };

  componentDidMount() {
    this.fetchDecks();
  }

  fetchDecks = () => {
    let plans = cookie.getJSON("plans");

    this.setState({plans})

    api.fetchDecks().then(response => {
      this.setState({ decks: response.data, isLoading: false });
    });
  };

  handleUpdatePlan = (ev, deck, planId) => {
    const tags = deck.tags.map(el => el._id || el);
    let { membershipLevel } = deck;
    let idx = membershipLevel.indexOf(planId);
    if (idx > -1) {
      membershipLevel.splice(idx, 1);
    }
    else {
      membershipLevel.push(planId)
    }
    api.editDeck({...deck, tags, membershipLevel})
  }

  render() {
    const { isLoading, plans, decks } = this.state;

    console.log(plans, decks)

    return (
      <div className="account-page mt-4">
        <div className="container">
          <div className="row">
          {!isLoading ? (
            <Table celled compact definition>
              <Table.Header fullWidth>
                <Table.Row>
                  <Table.HeaderCell>Deck</Table.HeaderCell>
                  {plans && plans.length > 0 && plans.map((plan) =>
                    <Table.HeaderCell key={plan['id']}>{plan['name']}</Table.HeaderCell>
                  )}
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {decks && decks.length > 0 && decks.map((deck) => {
                  return (
                    <Table.Row key={deck['_id']}>
                      <Table.Cell>
                        <Label ribbon>{deck['title']}</Label>
                      </Table.Cell>
                      {plans && plans.length > 0 && plans.map((plan) => {
                        let value = deck.membershipLevel.indexOf(parseInt(plan['id'])) >= 0
                        return (
                          <Table.Cell key={plan['id']}>
                            <Checkbox defaultChecked={value} onChange={(ev) => this.handleUpdatePlan(ev, deck, parseInt(plan['id']))} />
                          </Table.Cell>
                        )
                      })}
                    </Table.Row>
                  )
                })}
              </Table.Body>

              <Table.Footer>
              </Table.Footer>
            </Table>
          ) : (
            <EmptyView
              title={isLoading ? "Loading decks..." : "No decks in your collection yet"}
              description={
                isLoading
                  ? "Satellites are beeping, electrons are whirling, and your data is on its way to your device..."
                  : "Decks are groups of related cards for organizing your notes. Haven't created a deck yet? No problem. Click 'Create Deck +' to get started."
              }
            />
          )}

          </div>
        </div>
      </div>
    );
  }
}

export default withErrors(Memberships);
