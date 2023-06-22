import axios from 'axios';

const instance = axios.create({
  headers: {
    Accept: 'application/json',
  },
});

const Api = {
  getData() {
    return instance.get('/data');
  },
};

export default Api;
