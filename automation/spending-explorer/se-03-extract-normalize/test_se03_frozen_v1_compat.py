import copy
import json
import unittest
from pathlib import Path
from se03_frozen_v1_compat import project
from se03_staging_normalize import Rejected


def fixture():
    profile=json.loads(Path(__file__).with_name('se03_frozen_v1_compat_rules.json').read_text())
    records=[]
    for i,rule in enumerate(profile['rules']):
        records.append(dict(source_id=profile['source_id'],fiscal_year=profile['fiscal_year'],
            measure_type=profile['measure_type'],entity_type='ACTIVITY',canonical_entity_key=rule['source_activity_key'],
            economic_code=rule['economic_code'],amount_jmd=100+i,source_page=rule['source_page'],
            recurrent_or_capital='RECURRENT',budget_number='1',vote_id='VOTE_'+rule['source_activity_key'].split('_')[0],
            source_geometry={'word_bbox':[390,200,427,210]},source_y=200))
    return records,profile


class Tests(unittest.TestCase):
    def test_eight_rules_preserve_values_and_complete_physical_evidence(self):
        records,profile=fixture();before=copy.deepcopy(records)
        output,report=project(records,profile)
        self.assertEqual(report['mapped_rows'],8)
        self.assertEqual(records,before)
        self.assertEqual(sum(r['amount_jmd'] for r in output),sum(r['amount_jmd'] for r in records))
        self.assertEqual(output[0]['source_page'],'445')
        self.assertEqual(output[0]['physical_source_evidence']['source_page'],'446')
        self.assertEqual(output[0]['physical_source_evidence']['source_geometry'],records[0]['source_geometry'])
        self.assertNotIn('source_geometry',output[0])
        self.assertFalse(report['publication_authorized'])

    def test_missing_rule_hit_fails(self):
        records,profile=fixture()
        with self.assertRaises(Rejected):project(records[:-1],profile)

    def test_duplicate_rule_hit_fails(self):
        records,profile=fixture()
        with self.assertRaises(Rejected):project(records+[records[0]],profile)

    def test_source_page_change_does_not_match_rule(self):
        records,profile=fixture();records[0]['source_page']='447'
        with self.assertRaises(Rejected):project(records,profile)

    def test_measure_precondition_cannot_change(self):
        records,profile=fixture();records[0]['measure_type']='AUTHORIZED_BY_LAW'
        with self.assertRaises(Rejected):project(records,profile)

    def test_cross_programme_mapping_fails(self):
        records,profile=fixture();profile['rules'][0]['canonical_programme_key']='99999_04_02_001'
        with self.assertRaises(Rejected):project(records,profile)

    def test_duplicate_rule_identifier_fails(self):
        records,profile=fixture();profile['rules'][1]['rule_id']=profile['rules'][0]['rule_id']
        with self.assertRaises(Rejected):project(records,profile)

    def test_profile_cannot_grant_release(self):
        records,profile=fixture();profile['publication_authorized']=True
        with self.assertRaises(Rejected):project(records,profile)

    def test_unmapped_record_keeps_original_grain_and_page(self):
        records,profile=fixture();other=dict(records[0],canonical_entity_key='01000_01_01_163_01_10001',economic_code='21',source_page='13',vote_id='VOTE_01000')
        output,_=project(records+[other],profile)
        self.assertEqual(output[-1]['entity_type'],'ACTIVITY')
        self.assertEqual(output[-1]['source_page'],'13')
        self.assertIsNone(output[-1]['compatibility_rule_id'])

    def test_nested_evidence_is_independent_copy(self):
        records,profile=fixture();output,_=project(records,profile)
        output[0]['physical_source_evidence']['source_geometry']['word_bbox'][0]=0
        self.assertEqual(records[0]['source_geometry']['word_bbox'][0],390)


if __name__=='__main__':unittest.main()
