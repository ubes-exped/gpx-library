import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createHead } from '@unhead/vue';

createApp(App).use(router).use(createHead()).mount('body');
