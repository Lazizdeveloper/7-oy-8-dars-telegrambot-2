import { Injectable } from '@nestjs/common';
import TelegramBot, { KeyboardButton } from 'node-telegram-bot-api';
import { products, Product } from './products';
import { OrderService } from './order.service';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class TelegramService {
  private bot: TelegramBot;
  private userStates: { [userId: number]: { step: string; name?: string; phone?: string; location?: { lat: number; lon: number } } } = {};
  private readonly adminId: number;

  constructor(private readonly orderService: OrderService) {
    const token = process.env.BOT_TOKEN;
    if (!token) throw new Error('.env faylida BOT_TOKEN aniqlanmagan');
    this.bot = new TelegramBot(token, { polling: true });

    const adminId = process.env.ADMIN_ID;
    if (!adminId) throw new Error('.env faylida ADMIN_ID aniqlanmagan');
    this.adminId = parseInt(adminId, 10);

    this.setupHandlers();
  }

  private setupHandlers() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      if (!msg.from) return this.bot.sendMessage(chatId, 'Foydalanuvchi ma\'lumotlari topilmadi.');
      const userId = msg.from.id;
      this.userStates[userId] = { step: 'started' };
      this.userStates[userId].name = msg.from.first_name || 'Anonim';

      this.bot.sendMessage(chatId, `Salom, ${this.userStates[userId].name}! Telefon raqamingizni baham ko'ring:`, {
        reply_markup: {
          keyboard: [[{ text: 'Telefon raqamini yuborish', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
      this.userStates[userId].step = 'phone';
    });

    this.bot.onText(/\/users/, async (msg) => {
      const chatId = msg.chat.id;
      if (!msg.from) return this.bot.sendMessage(chatId, 'Foydalanuvchi ma\'lumotlari topilmadi.');
      const userId = msg.from.id;

      if (userId !== this.adminId) {
        return this.bot.sendMessage(chatId, 'Bu buyruq faqat admin uchun mavjud.');
      }

      try {
        const orders = await this.orderService.getAllOrders();
        if (orders.length === 0) {
          return this.bot.sendMessage(chatId, 'Hozircha hech qanday buyurtma yo‘q.');
        }

        const userList = orders.map((order, index) => {
          return `Foydalanuvchi ${index + 1}:\n` +
                 `ID: ${order.userId}\n` +
                 `Ismi: ${order.name || 'Noma\'lum'}\n` +
                 `Telefon: ${order.phone}\n` +
                 `Mahsulot: ${order.productName}\n` +
                 `Lokatsiya: ${order.location.lat}, ${order.location.lon}\n` +
                 `Buyurtma vaqti: ${new Date(order.createdAt).toLocaleString('uz-UZ')}\n` +
                 '---';
        }).join('\n');

        this.bot.sendMessage(chatId, `Foydalanuvchilar ro‘yxati:\n${userList}`);
      } catch (error) {
        this.bot.sendMessage(chatId, 'Foydalanuvchilar ro‘yxatini olishda xato yuz berdi.');
      }
    });

    this.bot.on('contact', (msg) => {
      const chatId = msg.chat.id;
      if (!msg.from) return this.bot.sendMessage(chatId, 'Foydalanuvchi ma\'lumotlari topilmadi.');
      const userId = msg.from.id;
      if (this.userStates[userId]?.step === 'phone') {
        if (!msg.contact) return this.bot.sendMessage(chatId, 'Telefon raqami topilmadi.');
        this.userStates[userId].phone = msg.contact.phone_number;
        this.bot.sendMessage(chatId, 'Lokatsiyangizni baham ko\'ring:', {
          reply_markup: {
            keyboard: [[{ text: 'Lokatsiyani yuborish', request_location: true }]],
            one_time_keyboard: true,
            resize_keyboard: true,
          },
        });
        this.userStates[userId].step = 'location';
      }
    });

    this.bot.on('location', (msg) => {
      const chatId = msg.chat.id;
      if (!msg.from) return this.bot.sendMessage(chatId, 'Foydalanuvchi ma\'lumotlari topilmadi.');
      const userId = msg.from.id;
      if (this.userStates[userId]?.step === 'location') {
        if (!msg.location) return this.bot.sendMessage(chatId, 'Lokatsiya topilmadi.');
        this.userStates[userId].location = { lat: msg.location.latitude, lon: msg.location.longitude };
        this.showCategories(chatId);
        this.userStates[userId].step = 'categories';
      }
    });

    this.bot.on('message', (msg) => {
      const chatId = msg.chat.id;
      if (!msg.from) return this.bot.sendMessage(chatId, 'Foydalanuvchi ma\'lumotlari topilmadi.');
      const userId = msg.from.id;
      const text = msg.text?.toLowerCase() ?? '';

      if (this.userStates[userId]?.step === 'categories' || this.userStates[userId]?.step === 'products') {
        let category: string | null = null;
        if (text.includes('ichimliklar')) category = 'ichimliklar';
        else if (text.includes('yeguliklar')) category = 'yeguliklar';
        else if (text.includes('shirinliklar')) category = 'shirinliklar';

        if (category) {
          this.showProducts(chatId, category);
          this.userStates[userId].step = 'products';
        }
      }
    });

    this.bot.on('callback_query', async (query) => {
      if (!query.message || !query.from) return;
      const chatId = query.message.chat.id;
      const userId = query.from.id;
      if (!query.data) return this.bot.sendMessage(chatId, 'Xato: Ma\'lumot topilmadi.');
      const data = query.data.split(':');
      const action = data[0];

      if (action === 'show_product') {
        const category = data[1];
        const productIndex = parseInt(data[2], 10);
        const product = products[category]?.[productIndex];
        if (!product) return this.bot.sendMessage(chatId, 'Mahsulot topilmadi.');
        this.showProductDetails(chatId, product);
      } else if (action === 'order') {
        const productName = data[1];
        const userState = this.userStates[userId];
        if (!userState?.phone || !userState?.location) {
          return this.bot.sendMessage(chatId, 'Iltimos, avval telefon raqami va lokatsiyani kiriting.');
        }

        try {
          await this.orderService.createOrder(userId, productName, userState.phone, userState.location, userState.name);
          this.bot.sendMessage(chatId, `Buyurtma qabul qilindi: ${productName}. Yetkazib berish: ${userState.location.lat}, ${userState.location.lon}. Telefon: ${userState.phone}`);
          this.bot.sendMessage(this.adminId, `Yangi buyurtma:\nMahsulot: ${productName}\nFoydalanuvchi: ${userState.name}\nTelefon: ${userState.phone}\nLokatsiya: ${userState.location.lat}, ${userState.location.lon}`);
        } catch (error) {
          this.bot.sendMessage(chatId, 'Buyurtma qabul qilishda xato yuz berdi. Qayta urinib ko\'ring.');
        }
      }

      this.bot.answerCallbackQuery(query.id);
    });
  }

  private showCategories(chatId: number) {
    const keyboard: KeyboardButton[][] = [
      [{ text: 'Ichimliklar' }],
      [{ text: 'Yeguliklar' }],
      [{ text: 'Shirinliklar' }],
    ];
    this.bot.sendMessage(chatId, 'Kategoriyani tanlang:', {
      reply_markup: {
        keyboard,
        resize_keyboard: true,
      },
    });
  }

  private showProducts(chatId: number, category: string) {
    const productList = products[category] || [];
    const inlineKeyboard = productList.map((p, index) => [
      { text: p.name, callback_data: `show_product:${category}:${index}` },
    ]);

    this.bot.sendMessage(chatId, `${category.charAt(0).toUpperCase() + category.slice(1)} ro'yxati:`, {
      reply_markup: { inline_keyboard: inlineKeyboard },
    });
  }

  private showProductDetails(chatId: number, product: Product) {
    const caption = `Nomi: ${product.name}\nNarxi: ${product.price} UZS\nTarkibi: ${product.composition}`;
    this.bot.sendPhoto(chatId, product.image, {
      caption,
      reply_markup: {
        inline_keyboard: [[{ text: 'Buyurtma berish', callback_data: `order:${product.name}` }]],
      },
    });
  }
}