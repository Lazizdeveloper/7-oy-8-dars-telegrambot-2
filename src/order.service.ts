import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async createOrder(userId: number, productName: string, phone: string, location: { lat: number; lon: number }, name?: string) {
    const order = new this.orderModel({
      userId,
      productName,
      phone,
      location,
      name,
    });
    return order.save();
  }

  async getAllOrders() {
    return this.orderModel.find().exec();
  }
}