import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerBusinessDto } from './create-customer-business.dto';

export class UpdateCustomerBusinessDto extends PartialType(CreateCustomerBusinessDto) { }