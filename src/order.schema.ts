import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type Location = {
  lat: number;
  lon: number;
};

@Schema({ timestamps: true }) // createdAt va updatedAt avtomatik qo'shiladi
export class Order extends Document {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    required: true,
    type: {
      lat: { type: Number, required: true },
      lon: { type: Number, required: true },
    },
  })
  location: Location;
}

export const OrderSchema = SchemaFactory.createForClass(Order);