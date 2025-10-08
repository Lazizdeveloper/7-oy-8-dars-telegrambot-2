import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';

@Injectable()
export class OrderService {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  async createOrder(userId: number, productName: string, phone: string, location: { lat: number; lon: number }) {
    const order = new this.orderModel({
      userId,
      productName,
      phone,
      location,
      createdAt: new Date(),
    });
    return order.save();
  }
}