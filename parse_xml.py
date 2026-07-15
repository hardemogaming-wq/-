import xml.etree.ElementTree as ET
import json
import sys
import os
import re

def parse_xml(xml_path, out_json_path, file_type):
    try:
        if not os.path.exists(xml_path):
            print(f"Error: XML file not found at {xml_path}")
            return False

        print(f"Reading and cleaning {xml_path}...")
        with open(xml_path, 'r', encoding='utf-8', errors='ignore') as f:
            xml_content = f.read()

        # Strip XML comments to prevent "double hyphen in comment" errors
        xml_content_clean = re.sub(r"<!--[\s\S]*?-->", "", xml_content)

        print(f"Parsing cleaned XML as {file_type}...")
        root = ET.fromstring(xml_content_clean)

        data = {}
        for surah in root:
            surah_index = surah.attrib.get('index')
            surah_name = surah.attrib.get('name', '')

            ayahs_list = []
            for ayah in surah.findall('aya'):
                ayah_index = ayah.attrib.get('index')
                ayah_text = ayah.attrib.get('text')
                if ayah_text is None:
                    ayah_text = ayah.text
                
                # Check if it has bismillah attribute
                bismillah = ayah.attrib.get('bismillah')
                
                if file_type == 'quran':
                    item = {ayah_index: ayah_text}
                    if bismillah:
                        item['bismillah'] = bismillah
                    ayahs_list.append(item)
                else:
                    item = {'ayah_index': ayah_index, 'text': ayah_text}
                    if bismillah:
                        item['bismillah'] = bismillah
                    ayahs_list.append(item)

            if file_type == 'quran':
                data[surah_index] = {
                    'name': surah_name,
                    'ayahs': ayahs_list
                }
            else:
                data[surah_index] = ayahs_list

        with open(out_json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        
        print(f"Success: Saved {file_type} data to {out_json_path}")
        return True

    except ET.ParseError as e:
        print(f"XML Parse Error: {e}")
        return False
    except Exception as e:
        print(f"Error occurred: {e}")
        return False

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: python parse_xml.py <input_xml_path> <output_json_path> <quran|tafsir|translation>")
        sys.exit(1)
        
    xml_path = sys.argv[1]
    out_json_path = sys.argv[2]
    file_type = sys.argv[3].lower()
    
    success = parse_xml(xml_path, out_json_path, file_type)
    if not success:
        sys.exit(1)
