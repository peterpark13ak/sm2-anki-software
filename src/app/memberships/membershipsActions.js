import axios from "../../helpers/authAxios";

export const fetchDecks = () => {
  return axios.get("/api/decks");
};

export const editDeck = deck => {
  return axios.put(`/api/decks/${deck._id}`, deck);
};
