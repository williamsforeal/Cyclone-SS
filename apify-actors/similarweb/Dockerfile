FROM apify/actor-node-playwright-chrome:18
COPY package*.json ./
RUN npm install --omit=dev --omit=optional
COPY . ./
CMD npm start
