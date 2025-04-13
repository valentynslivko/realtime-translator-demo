from pathlib import Path
import base64
import requests

path = Path('~/Music')

# print(path)

def audio_to_base64(file_path: str):
    with open(file_path, "rb") as audio_file:
        encoded_string = base64.b64encode(audio_file.read()).decode('utf-8')
    return encoded_string


N8N_WORKFLOW_TEST_URL = 'http://localhost:5678/webhook-test/4e0dea8e-3e97-40f1-870a-cbfca6a68ace'

def invoke_n8n():
    b64_audio = audio_to_base64("/home/demigorrgon/Music/eatbot_test_normal_speed.mp3")
    resp = requests.post(N8N_WORKFLOW_TEST_URL, data=b64_audio)
    print(resp.status_code, resp.text)
    return

if __name__ == '__main__':
    invoke_n8n()