// @flow
import React, { Component } from "react";
import { Header, Button, Input, Grid } from "semantic-ui-react";
import type { Deck } from "../../types";
import TreeView from 'deni-react-treeview';
import cookie from "js-cookie";

import withErrors from "../../helpers/withErrors";

import * as api from "./deckActions";

import DeckCard from "./DeckCard";

import "./Decks.css";

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

type Props = {
  history: any,
  onError: any,
};

type State = {
  decks: Array<Deck>,
  filter: string,
};

class Decks extends Component<Props, State> {
  state = { decks: [], filter: "", isLoading: true };

  componentWillMount = () => {
    this.fetchDecks();
  };

  onGoto = (event: Event, data: any) => this.props.history.push(data.value);

  onSearch = ({ target }: { target: HTMLInputElement }) => this.setState({ filter: target.value });

  fetchDecks = () => {
    let membership_level = cookie.getJSON("user")['membership'];

    api.fetchDecks().then(response => {
      let decks = []
      response.data && response.data.map((cur) => {
        if (membership_level === 0 || (membership_level === 1 && cur['tags'][0]['value'] === 'Getting Started')) {
          decks.push(cur)
        }
      })
      this.setState({ decks: decks, isLoading: false });
    });
  };

  handleSelectDock = (item) => {
    if (item.isLeaf === true) {
      this.props.history.push(`/decks/${item.deckId}`)
    }
    else {
      this.props.history.push(`/decks/tag/${item.text}`)
    }
  }

  render() {
    const { decks = [], filter, isLoading } = this.state;

    const filteredDecks =
      filter.length > 0 ? decks.filter(deck => deck.title.indexOf(filter) !== -1) : decks;

    var tags = []

    filteredDecks && filteredDecks.map((deck) => {
      deck.tags && deck.tags.map((tag) => {
        var idx = tags.indexOf(tag.value)
        if (idx < 0) {
          tags.push(tag.value)
        }
      })
    })

    var treeView = []
    tags.map((tag, tagIdx) => {
      var item = {
        id: (tagIdx + 1) * 1000,
        text: tag,
        expanded: true,
        children: []
      }
      var childIdx = 1
      filteredDecks && filteredDecks.map((deck) => {
        var flag = 0
        deck.tags && deck.tags.map((deckTag) => {
          if (deckTag.value === tag) {
            flag = 1
          }
        })
        if (flag === 1) {
          item.children.push({
            id: (tagIdx + 1) * 1000 + childIdx,
            text: `${deck.title} (${deck.cardsCount})`,
            deckId: deck._id,
            isLeaf: true
          })
          childIdx ++
        }
      })
      treeView.push(item)
    })

    return (
      <div className="decks-page mt-4">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="decks-container-header">
                <div>
                  <h1 className="h5 m-0">Decks</h1>
                  <p className="text-secondary m-0">{decks.length} decks in your collection</p>
                </div>
                <div className="decks-container-actions">
                  {decks.length > 0 && (
                    <Input
                      className="mr-3"
                      icon="search"
                      onChange={this.onSearch}
                      placeholder="Search for decks..."
                    />
                  )}
                  <Button onClick={this.onGoto} value="decks/new" primary>
                    Create Deck +
                  </Button>
                </div>
              </div>
              <hr className="mt-2 mb-2" />
              <Grid divided>
                <Grid.Row>
                  <Grid.Column width={5}>
                    <TreeView 
                      items={treeView}
                      onSelectItem={this.handleSelectDock}
                    />
                  </Grid.Column>
                  <Grid.Column width={11}>
                  {!isLoading && filteredDecks.length > 0 ? (
                    <div className="row">
                      {filteredDecks.map((deck, key) => (
                        <DeckCard
                          className="col-12 col-sm-12 col-md-6 col-lg-6 float-left"
                          deck={deck}
                          key={key}
                        />
                      ))}
                    </div>
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
                  </Grid.Column>
                </Grid.Row>
              </Grid>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withErrors(Decks);
