/*
 * Copyright (C) 2018 Ryan Mason - All Rights Reserved
 *
 * Permissions of this strong copyleft license are conditioned on making available complete source code of licensed works and modifications, which include larger works using a licensed work, under the same license. Copyright and license notices must be preserved. Contributors provide an express grant of patent rights.
 *
 * https://github.com/Rytiggy/Glance/blob/master/LICENSE
 * ------------------------------------------------
 *
 * You are free to modify the code but please leave the copyright in the header.
 *
 * ------------------------------------------------
 */

// Import the messaging module
import { outbox } from "file-transfer";
import { encode } from 'cbor';

export default class transfer { 
  // Send data
  send(data) {
    console.log("Sending request to companion: " + JSON.stringify(data));
    outbox.enqueue("request.cbor", encode(data));
  }
};


