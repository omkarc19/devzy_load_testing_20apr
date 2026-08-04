import type { Request, Response } from 'express';
import type { OrdersService } from '../services/orders.service.js';
import {
  batchGetOrdersSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  parseOrThrow,
  updateStatusSchema,
} from '../utils/validation.js';
import { format } from '../utils/money.js';
import type { Order } from '../models/order.js';

/**
 * Serializes an internal {@link Order} into the JSON shape returned to clients,
 * formatting money fields for display while keeping the raw minor units.
 */
function serialize(order: Order) {
  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    currency: order.currency,
    discountPercent: order.discountPercent,
    items: order.items.map((i) => ({
      sku: i.sku,
      name: i.name,
      quantity: i.quantity,
      unitPriceMinor: i.unitPrice.amountMinor,
      unitPriceDisplay: format(i.unitPrice),
    })),
    totalMinor: order.total.amountMinor,
    totalDisplay: format(order.total),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/**
 * Thin HTTP layer over {@link OrdersService}. Controllers only validate input,
 * delegate to the service, and shape the response — no business logic here.
 */
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const input = parseOrThrow(createOrderSchema, req.body);
    const order = await this.orders.createOrder(input);
    res.status(201).json(serialize(order));
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orders.getOrder(req.params.id as string);
    res.json(serialize(order));
  };

  batchGet = async (req: Request, res: Response): Promise<void> => {
    const { ids } = parseOrThrow(batchGetOrdersSchema, req.body);
    const orders = await this.orders.getOrdersByIds(ids);
    res.json({ orders: orders.map(serialize) });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = parseOrThrow(listOrdersQuerySchema, req.query);
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const filter = {
      ...(query.status ? { status: query.status } : {}),
      limit,
      offset,
    };
    const { orders, total } = await this.orders.listOrders(filter);
    res.json({
      total,
      limit,
      offset,
      orders: orders.map(serialize),
    });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = parseOrThrow(updateStatusSchema, req.body);
    const order = await this.orders.updateStatus(req.params.id as string, status);
    res.json(serialize(order));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const order = await this.orders.cancelOrder(req.params.id as string);
    res.json(serialize(order));
  };
}
