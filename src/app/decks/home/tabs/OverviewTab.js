import React from "react";
import marked from "marked";
import { Icon, Tab, Header, Label } from "semantic-ui-react";

import { Octicon } from "../../../../components";

const OverviewTab = ({ deck, parentDeck, emoji = "✌️" }) => (
  <Tab.Pane padded="very">
    {deck.notes ? (
      <div>
        {parentDeck.notes !== null && parentDeck.notes !== undefined &&
          <div style={{position: 'relative'}}>
            <Label className="rounded-0" attached="top">
              <Icon name="book" />Default Notes
            </Label>
            <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked(parentDeck.notes) }} />
          </div>
        }
        <div style={{borderTop: 'solid 1px #888', marginTop: 40}} />
        <div style={{position: 'relative'}}>
          <Label className="rounded-0" attached="top">
            <Icon name="book" />Notes
          </Label>
          <div className="markdown-body" dangerouslySetInnerHTML={{ __html: marked(deck.notes) }} />
        </div>
      </div>
    ) : (
      <div className="blankslate blankslate-spacious">
        <Header size="large">
          {emoji} Missing notes
          <Header.Subheader className="text-secondary" style={{ lineHeight: "1.4em" }}>
            Use notes to capture additional information about your decks
          </Header.Subheader>
        </Header>
      </div>
    )}
  </Tab.Pane>
);

OverviewTab.MenuItem = () => ({
  key: "overview",
  icon: <Octicon name="graph" className="mr-1" />,
  content: <span className="font-weight-medium">Overview</span>,
});

export default OverviewTab;
