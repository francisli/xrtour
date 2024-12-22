import axios from 'axios';

const instance = axios.create({
  headers: {
    Accept: 'application/json',
  },
});

const Api = {
  getData(TourLink) {
    return instance.get(`/tours/${TourLink}`);
  },
  post(event, properties) {
    return instance.post('/view', { event, properties });
  },
};

export default Api;
