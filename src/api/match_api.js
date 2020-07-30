import axios from "axios";

import { url } from "./index";

/*Match API CALLS*/

export const fetchMatches_Event = async (key) => {
  try {
    const matches = await axios.get(`${url}/matches/event/${key}`);
    console.log(matches);
    return matches.data;
  } catch (error) {
    return error;
  }
};