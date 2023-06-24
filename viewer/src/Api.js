import axios from 'axios';

const instance = axios.create({
  headers: {
    Accept: 'application/json',
  },
});

const Api = {
  getData(TourLink) {
    return instance.get(`/${TourLink}`);
  },
};

export default Api;
