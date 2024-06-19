import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { AppService } from './app.service';
import Stripe from 'stripe';
import * as process from 'process';

@Controller()
export class AppController {
  private readonly stripe: Stripe;

  constructor(private readonly appService: AppService) {
    this.stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY,
      { apiVersion: '2024-04-10' }
    );
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('session')
  async createCheckoutSession(): Promise<any> {
    const session  = await this.stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      billing_address_collection: 'auto',
      line_items: [
        {
          price: process.env.STRIPE_PRICE,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // success_url: 'https://webhook.site/2faaa6a8-da2f-49db-b897-bb1fa63da4a4',
      // return_url: 'http://localhost:3000/return',
      // cancel_url: 'https://webhook.site/2faaa6a8-da2f-49db-b897-bb1fa63da4a4',
      customer: process.env.STRIPE_CUSTOMER,
      // cancel_url: 'http://localhost:3000/',
      redirect_on_completion: 'never',
    })
    console.log(session);
    return session;
  }

  @Get('session-status')
  async getSessionStatus(@Query('session_id') session_id: string): Promise<any> {
    return await this.stripe.checkout.sessions.retrieve(session_id);
  }

  @Get('subscription')
  async getSubscription(@Query('id') id: string): Promise<any> {
    const subscription = await this.stripe.subscriptions.retrieve(id, { expand: ['customer.default_source', 'plan.product'] });
    // const customer = await this.stripe.customers.retrieve('cus_QJKq752LScAXQz');
    // const paymentMethods = await this.stripe.customers.listPaymentMethods('cus_QJKq752LScAXQz');
    console.log(subscription);

    return subscription;
  }

  @Post('subscription')
  async createSubscription(): Promise<any> {
    const subscription: any = await this.stripe.subscriptions.create({
      customer: process.env.STRIPE_CUSTOMER,
      items: [{ price: process.env.STRIPE_PRICE }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent', 'pending_setup_intent'],
    });
    if (subscription.pending_setup_intent !== null) {
      return {
        type: 'setup',
        clientSecret: subscription.pending_setup_intent.client_secret,
        id: subscription.id,
        status: subscription.status,
      };
    }

    return {
      type: 'payment',
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      id: subscription.id,
      status: subscription.status,
    }
  }

  @Post('proration')
  async getProration(@Body() { subItemId, priceId, subId }: any): Promise<any> {
    const proration_date = Math.floor(Date.now() / 1000);

    // See what the next invoice would look like with a price switch
    // and proration set:
    const items = [{
      id: subItemId,
      price: priceId, // Switch to new price
    }];

    const invoice = await this.stripe.invoices.retrieveUpcoming({
      subscription: subId,
      subscription_items: items,
      subscription_proration_date: proration_date,
    });
    console.log(invoice);
    return invoice;
  }

  @Post('upgrade')
  async upgradeSubscription(@Body() { subItemId, priceId, subId }: any): Promise<any> {
    const proration_date = Math.floor(Date.now() / 1000);
    const subscription = await this.stripe.subscriptions.update(subId, {
      items: [{
        id: subItemId,
        price: priceId, // Switch to new price
      }],
      payment_behavior: 'default_incomplete',
      proration_behavior: 'always_invoice',
      proration_date,
    });
    console.log(subscription);

    return subscription;
  }

  @Post('webhook')
  stripeWebhook(@Body() body: any): any {
    console.log(body);
    return {
      message: 'Success',
    };
  }
}
