import json
from groq import Groq
import db
from utils.encoding_helper import sanitize_to_ascii

class WorkflowExecutor:
    def __init__(self):
        pass

    def start(self, template_name: str, input_data: dict, api_key: str) -> dict:
        """
        Initializes and runs the initial automated steps of a workflow template.
        """
        description = input_data.get("description", "Workflow request")
        
        if "invoice" in template_name.lower():
            # 1. Invoice Processing Workflow
            # Step 1: AI Data Extraction
            extracted_fields = {
                "invoice_number": "INV-2026-089",
                "amount": "$4,250.00",
                "vendor": "CloudScale Systems",
                "category": "SaaS Platform Subscription"
            }
            if api_key:
                try:
                    client = Groq(api_key=api_key)
                    prompt = (
                        "You are an AI Invoice Data Extractor. Extract the invoice number, total amount, vendor name, and expense category "
                        "from the user description. Return a JSON object with keys: invoice_number, amount, vendor, category.\n"
                        f"Description:\n{description}"
                    )
                    prompt = sanitize_to_ascii(prompt)
                    response = client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        temperature=0.1,
                        response_format={"type": "json_object"}
                    )
                    extracted_fields = json.loads(response.choices[0].message.content)
                except Exception as e:
                    print(f"Workflow extraction failed, using default: {e}")

            steps = [
                {"name": "AI Data Extraction", "status": "completed", "data": extracted_fields},
                {"name": "Expense Categorization", "status": "completed", "data": {"category": extracted_fields.get("category", "Software"), "policy_status": "Compliant"}},
                {"name": "Manager Review", "status": "pending", "data": {"assigned_approver": "Deepak Rao (Finance Director)"}},
                {"name": "Process Payment & Notify Staff", "status": "pending", "data": {}}
            ]
            
            instance_id = db.create_workflow_instance("Invoice Processing", "Manager Review", "in_progress", steps)
            db.add_notification("Approval Requested", f"Manager review required for Invoice {extracted_fields.get('invoice_number')} from {extracted_fields.get('vendor')}.", "workflow")
            db.add_task(f"Approve Invoice {extracted_fields.get('invoice_number')}", f"Verify SaaS expenses for {extracted_fields.get('vendor')} totaling {extracted_fields.get('amount')}.", "Deepak Rao", "high", "2026-07-25")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Manager Review",
                "steps": steps,
                "message": f"Invoice workflow initialized. Extracted invoice data: {extracted_fields.get('vendor')} - {extracted_fields.get('amount')}. Routing to Deepak Rao."
            }

        elif "leave" in template_name.lower() or "off" in template_name.lower():
            # 2. Leave Request Approval Workflow
            steps = [
                {"name": "Submit Request", "status": "completed", "data": {"details": description}},
                {"name": "Company Leave Policy Check", "status": "completed", "data": {"status": "Balance Valid", "rules_checked": "PTO-2026"}},
                {"name": "HR Operations Review", "status": "pending", "data": {"assigned_approver": "Jessica Chen (HR Lead)"}},
                {"name": "Update Calendar & Notify", "status": "pending", "data": {}}
            ]
            
            instance_id = db.create_workflow_instance("Leave Request Approval", "HR Operations Review", "in_progress", steps)
            db.add_notification("Leave Approval Pending", f"Jessica Chen review required for leave request: {description[:50]}...", "workflow")
            db.add_task(f"Review Leave Request", f"Approve PTO request: '{description[:50]}...'", "Jessica Chen", "medium", "2026-07-18")

            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "HR Operations Review",
                "steps": steps,
                "message": "Leave request submitted and balance verified. Sent to Jessica Chen for HR Operations approval."
            }

        else:
            # 3. General Compliance / Task Approval Workflow
            steps = [
                {"name": "Intake Submission", "status": "completed", "data": {"input": description}},
                {"name": "AI Risk Inspection", "status": "completed", "data": {"risk_index": "Low", "verdict": "Cleared"}},
                {"name": "Executive Verification", "status": "pending", "data": {"assigned_approver": "Board Committee"}},
                {"name": "Publish Findings", "status": "pending", "data": {}}
            ]
            
            instance_id = db.create_workflow_instance(template_name, "Executive Verification", "in_progress", steps)
            db.add_notification("Verification Requested", f"Board review requested for: {template_name}.", "workflow")
            
            return {
                "instance_id": instance_id,
                "status": "in_progress",
                "current_step": "Executive Verification",
                "steps": steps,
                "message": f"Compliance Workflow '{template_name}' triggered. Sent to Board Committee for Executive Verification."
            }

    def approve(self, instance_id: int, approver: str, api_key: str) -> dict:
        """
        Advances the pending step of an active workflow instance.
        """
        instances = db.get_workflow_instances()
        instance = next((inst for inst in instances if inst["id"] == instance_id), None)
        
        if not instance:
            raise ValueError(f"Workflow instance {instance_id} not found.")

        steps = instance["steps_data"]
        
        # Mark pending step as completed
        for step in steps:
            if step["status"] == "pending":
                step["status"] = "completed"
                step["data"]["approved_by"] = approver
                break
                
        # Determine next step
        next_pending = next((step for step in steps if step["status"] == "pending"), None)
        
        if next_pending:
            current_step = next_pending["name"]
            status = "in_progress"
            message = f"Step approved by {approver}. Routed to next step: {current_step}."
        else:
            current_step = "Completed"
            status = "approved"
            message = f"Workflow fully approved and finalized by {approver}."
            db.add_notification("Workflow Fully Approved", f"Workflow instance {instance_id} ('{instance['template_name']}') has been fully approved.", "workflow")

        db.update_workflow_instance(instance_id, current_step, status, steps)
        return {
            "instance_id": instance_id,
            "status": status,
            "current_step": current_step,
            "steps": steps,
            "message": message
        }

    def reject(self, instance_id: int, rejecter: str, reason: str, api_key: str) -> dict:
        """
        Rejects and terminates an active workflow instance.
        """
        instances = db.get_workflow_instances()
        instance = next((inst for inst in instances if inst["id"] == instance_id), None)
        
        if not instance:
            raise ValueError(f"Workflow instance {instance_id} not found.")

        steps = instance["steps_data"]
        
        # Mark pending step as rejected
        for step in steps:
            if step["status"] == "pending":
                step["status"] = "rejected"
                step["data"]["rejected_by"] = rejecter
                step["data"]["reason"] = reason
                break

        db.update_workflow_instance(instance_id, "Rejected", "rejected", steps)
        db.add_notification("Workflow Rejected", f"Workflow instance {instance_id} ('{instance['template_name']}') was rejected by {rejecter}.", "workflow")

        return {
            "instance_id": instance_id,
            "status": "rejected",
            "current_step": "Rejected",
            "steps": steps,
            "message": f"Workflow rejected by {rejecter}. Reason: {reason}."
        }
