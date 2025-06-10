import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime
import re


def extract_sms_from_xml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()
    sms_list = []
    
    for sms in root.findall("sms"):
        sms_data = {
            "address": sms.get("address"),
            "date": sms.get("date"),
            "body": sms.get("body")
        }
        sms_list.append(sms_data)
    
    return sms_list


def classify_transaction_type(body):
    body_lower = body.lower()
    if "transferred to" in body_lower and "from" in body_lower:
        return "Transfer to Mobile Number"
    return None


def parse_transaction_details(body):
    amount = ""
    recipient = ""
    
    # Try to extract amount
    amount_match = re.search(r"(\d{1,3}(?:,\d{3})*|\d+)\s*RWF", body)
    if amount_match:
        amount = amount_match.group(1)
    
    # Try to extract recipient (basic method)
    if "to" in body:
        recipient_part = body.split("to")[-1]
        recipient = recipient_part.split("at")[0].strip().split("(")[0].strip()
    
    return amount, recipient


def process_sms(sms_list):
    transactions = []
    for sms in sms_list:
        body = sms["body"]
        txn_type = classify_transaction_type(body)
        if txn_type:
            amount, recipient = parse_transaction_details(body)
            transactions.append({
                "Type": txn_type,
                "Amount": amount,
                "Recipient/Details": recipient,
                "Raw Message": body
            })
    return transactions


def save_to_json(transactions, output_file):
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(transactions, f, indent=4, ensure_ascii=False)


def main():
    xml_file = "momo_sms.xml"
    if not os.path.exists(xml_file):
        print(f"File '{xml_file}' not found. Please place it in the root folder.")
        return
    
    sms_list = extract_sms_from_xml(xml_file)
    transactions = process_sms(sms_list)
    save_to_json(transactions, "transfers_to_mobile.json")
    print("✅ Transfer to mobile transactions processed and saved to 'transfers_to_mobile.json'.")


if __name__ == "__main__":
    main()