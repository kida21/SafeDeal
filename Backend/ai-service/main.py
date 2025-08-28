import os
import json
import logging
import grpc
from concurrent import futures
import google.generativeai as genai

# Import the generated gRPC classes
import arbitrator_pb2
import arbitrator_pb2_grpc

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- Gemini API Client Initialization ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    logging.error("GEMINI_API_KEY environment variable not set.")
    raise ValueError("GEMINI_API_KEY environment variable not set.")

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')

# --- gRPC Servicer Implementation ---
# This class contains the logic for each of the gRPC service methods.
class AIArbitratorServicer(arbitrator_pb2_grpc.AIArbitratorServicer):
    """
    Implements the gRPC service methods for AI-powered conflict resolution.
    """

    def RequestMediation(self, request, context):
        """
        Handles the mediation request by generating a neutral AI message.
        """
        logging.info(f"Received mediation request for escrow: {request.escrow_id}")
        try:
            # Format chat history from the gRPC message
            chat_history = "\n".join([f"{msg.sender_id}: {msg.text}" for msg in request.chat])
            
            # Build the prompt for mediation
            prompt = f"""You are a neutral, impartial AI mediator for an escrow platform named SafeDeal. Your goal is to help resolve a dispute by summarizing the issues and suggesting a path to resolution. You should not take a side.

Here are the details of the escrow contract:
- Escrow ID: {request.escrow_id}
- Escrow Description: {request.description}

Here is the chat history between the buyer and seller:
{chat_history}

Please analyze the situation and draft a brief, de-escalating message to both parties. Summarize the key points of contention and propose a constructive next step. Avoid taking sides."""
            
            # Call the Gemini API
            response = model.generate_content(prompt)
            mediation_message = response.candidates[0].content.parts[0].text
            
            logging.info(f"Successfully generated mediation message for escrow: {request.escrow_id}")
            # Return the generated message in the gRPC response object
            return arbitrator_pb2.MediationResponse(message=mediation_message)

        except Exception as e:
            logging.error(f"Error during mediation for escrow {request.escrow_id}: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return arbitrator_pb2.MediationResponse()

    def RequestDecision(self, request, context):
        """
        Handles the final decision request by generating a structured AI decision.
        """
        logging.info(f"Received decision request for escrow: {request.escrow_id}")
        try:
            # Format chat history from the gRPC message
            chat_history = "\n".join([f"{msg.sender_id}: {msg.text}" for msg in request.chat])
            
            # Build the structured prompt for decision-making
            prompt = f"""You are an impartial AI judge for the SafeDeal escrow platform. Your task is to make a final, binding decision on this dispute based on the provided facts. You must decide whether to 'RELEASE_TO_SELLER' or 'REFUND_TO_BUYER'.

Escrow Contract Details:
- Escrow ID: {request.escrow_id}
- Escrow Description: {request.description}
- Amount: {request.amount}
- Chat History:
{chat_history}
- Dispute Conditions:
{request.dispute_conditions_json}

Please make a final decision based on all the information. Output your response as a JSON object with two fields: 'decision' (string) and 'justification' (string)."""
            
            # Call the Gemini API with structured response config
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            # The API returns a string that must be parsed
            decision_data = json.loads(response.candidates[0].content.parts[0].text)
            
            logging.info(f"Successfully generated decision for escrow: {request.escrow_id}")
            # Return the decision and justification in the gRPC response object
            return arbitrator_pb2.DecisionResponse(
                decision=decision_data.get("decision", "UNDECIDED"),
                justification=decision_data.get("justification", "No justification provided.")
            )

        except Exception as e:
            logging.error(f"Error during decision-making for escrow {request.escrow_id}: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return arbitrator_pb2.DecisionResponse()

# --- gRPC Server Startup ---
def serve():
    """
    Starts the gRPC server on the specified port.
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    arbitrator_pb2_grpc.add_AIArbitratorServicer_to_server(AIArbitratorServicer(), server)
    server.add_insecure_port('[::]:50055')
    logging.info("Starting gRPC server on port 50055...")
    server.start()
    server.wait_for_termination()

if __name__ == '__main__':
    serve()
