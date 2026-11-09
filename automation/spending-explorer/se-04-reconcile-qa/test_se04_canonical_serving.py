import copy
import unittest
from decimal import Decimal
from se04_canonical_serving import (
    NET,REFERENCE_FIELDS,Rejected,canonical_replay,category_for,serving_qa,FACT_HEADERS,hierarchy_cohorts,
)

SID='SRC_EOE_2026_27_PASSED'
URL='https://www.mof.gov.jm/approved.pdf'


def refs():
    return {
        'DIM_Period':{'P':dict(period_id='P',fiscal_year='2026/27',period_type='ANNUAL',period_start='2026-04-01',period_end='2027-03-31')},
        'DIM_Organisation':{'ORG_GG':dict(official_name='Government',public_display_name='Gov')},
        'DIM_Function':{'FUNC_01':dict(function_name='Public')},
        'DIM_SubFunction':{'SFUNC_01_01':dict(function_id='FUNC_01')},
        'DIM_Vote':{'VOTE_01000':dict(organisation_id='ORG_GG',budget_number='1',budget_type='RECURRENT',fiscal_year='2026/27')},
        'DIM_Programme':{'PROG_01000_01_01_163':dict(programme_name='Management',organisation_id='ORG_GG',function_id='FUNC_01')},
        'DIM_SubProgramme':{'SPROG_01000_01_01_163_01':dict(programme_id='PROG_01000_01_01_163',organisation_id='ORG_GG')},
        'DIM_Activity':{'ACT_01000_01_01_163_01_10001':dict(subprogramme_id='SPROG_01000_01_01_163_01',programme_id='PROG_01000_01_01_163',organisation_id='ORG_GG')},
        'DIM_Economic_Classification':{'ECON_21':dict(economic_name='Employees'),'ECON_AIA':dict(economic_name='AIA')},
        'DIM_Funding_Source':{},'DIM_Location':{},'Source_Catalog':{SID:dict(source_url=URL)},
        'MAP_Public_Categories':[
            dict(source_field='function_id',source_value='FUNC_01',priority_order='101',public_category_id='CAT_GOVERNANCE',public_category_name='Governance',include_in_every_100='TRUE'),
            dict(source_field='economic_id',source_value='ECON_AIA',priority_order='5',public_category_id='CAT_AIA_OFFSET',public_category_name='AIA offset',include_in_every_100='TRUE')],
    }


def source(amount=100):
    return dict(source_id=SID,fiscal_year='2026/27',measure_type='AUTHORIZED_BY_LAW',entity_type='ACTIVITY',
        canonical_entity_key='01000_01_01_163_01_10001',economic_code='21',amount_jmd=amount,
        source_page='13',recurrent_or_capital='RECURRENT',budget_number='1',vote_id='VOTE_01000')


def baseline(amount=100):
    row=dict.fromkeys(FACT_HEADERS,'')
    row.update(fact_id='F1',source_id=SID,period_id='P',fiscal_year='2026/27',period_type='ANNUAL',
        period_start='2026-04-01',period_end='2027-03-31',measure_type='AUTHORIZED_BY_LAW',estimate_version='AS_PASSED',
        organisation_id='ORG_GG',function_id='FUNC_01',subfunction_id='SFUNC_01_01',programme_id='PROG_01000_01_01_163',
        subprogramme_id='SPROG_01000_01_01_163_01',activity_id='ACT_01000_01_01_163_01_10001',economic_id='ECON_21',
        public_category_id='CAT_GOVERNANCE',amount_jmd=f'{amount:,}',amount_unit='JMD',amount_jmd_normalized=f'{amount:,}',currency='JMD',
        is_actual='FALSE',is_budget='TRUE',is_revised='FALSE',source_page='13',
        source_row='Activity 10001; economic 21; AUTHORIZED_BY_LAW',import_batch_id='OLD_BATCH',loaded_at='2026-07-20T15:00:00-05:00',
        vote_id='VOTE_01000',budget_number='1',budget_type='RECURRENT')
    return row


def serving_fixture():
    first=baseline(NET+10)
    second=dict(first,fact_id='A1',measure_type='APPROPRIATIONS_IN_AID',function_id='',subfunction_id='',programme_id='',
        subprogramme_id='',activity_id='',economic_id='ECON_AIA',public_category_id='CAT_AIA_OFFSET',amount_jmd='-10',amount_jmd_normalized='-10')
    spending=[];every=[]
    for i,row in enumerate((first,second)):
        amount=int(row['amount_jmd_normalized'].replace(',',''))
        share=str((Decimal(amount)*100/NET).quantize(Decimal('.01')))
        spending.append(dict(record_id='S'+str(i),fiscal_year='2026/27',period_label='FY2026/27',period_type='ANNUAL',
            measure_type=row['measure_type'],organisation_id='ORG_GG',organisation_name='Gov',
            function_id=row['function_id'],function_name='Public' if i==0 else '',programme_id=row['programme_id'],programme_name='Management' if i==0 else '',
            economic_id=row['economic_id'],economic_name='Employees' if i==0 else 'AIA',public_category_id=row['public_category_id'],
            public_category_name='Governance' if i==0 else 'AIA offset',recurrent_or_capital='RECURRENT',amount_jmd=str(amount),share_of_total_pct=share,
            source_id=SID,source_url=URL,data_status='MODEL_APPROVED_RELEASE_NOT_AUTHORIZED',last_updated='2026-07-20T15:00:00-05:00'))
        every.append(dict(record_id='E'+str(i),fiscal_year='2026/27',period_label='FY2026/27',measure_type='APPROVED_BUDGET_NET',
            public_category_id=row['public_category_id'],public_category_name='Governance' if i==0 else 'AIA offset',amount_jmd=str(amount),
            denominator_amount_jmd=str(NET),share_pct=share,per_j100=share,display_order='2' if i==0 else '99',source_id=SID,source_url=URL,
            data_status='MODEL_APPROVED_RELEASE_NOT_AUTHORIZED',last_updated='2026-07-20T15:00:00-05:00'))
    return [first,second],spending,every,refs()


class Tests(unittest.TestCase):
    def test_dimension_introduction_cohorts_are_not_unscoped_totals(self):
        tables={}
        for name,key,current,prior in (('op_subprogramme','subprogramme_id',316,32),('op_activity','activity_id',766,74)):
            tables[name]=[{key:'NEW'+str(i),'active_from':'2026-04-01'} for i in range(current)]+[{key:'OLD'+str(i),'active_from':'2025-04-01'} for i in range(prior)]
        result=hierarchy_cohorts(tables)
        self.assertEqual(result['introduction_cohorts']['op_activity']['combined_unique_records'],840)
        self.assertTrue(result['fy25_additions_are_not_full_fy25_dimension_universe'])
        tables['op_activity'][0]['active_from']='2025-04-01'
        with self.assertRaises(Rejected):hierarchy_cohorts(tables)

    def test_canonical_33_field_replay_labels_inherited_provenance(self):
        rows,report=canonical_replay([source()],[baseline()],refs())
        self.assertEqual(rows[0],baseline());self.assertEqual(report['field_differences'],{})
        self.assertEqual(tuple(report['reference_only_fields']),REFERENCE_FIELDS)
        self.assertFalse(report['independent_33_field_source_reconstruction'])

    def test_missing_foreign_key_rejected(self):
        r=refs();r['DIM_Activity']={}
        with self.assertRaises(Rejected):canonical_replay([source()],[baseline()],r)

    def test_wrong_activity_parent_rejected(self):
        r=refs();r['DIM_Activity']['ACT_01000_01_01_163_01_10001']['subprogramme_id']='OTHER'
        with self.assertRaises(Rejected):canonical_replay([source()],[baseline()],r)

    def test_wrong_programme_owner_rejected(self):
        r=refs();r['DIM_Programme']['PROG_01000_01_01_163']['organisation_id']='OTHER'
        with self.assertRaises(Rejected):canonical_replay([source()],[baseline()],r)

    def test_changed_financial_value_cannot_be_copied_from_baseline(self):
        with self.assertRaises(Rejected):canonical_replay([source(101)],[baseline()],refs())

    def test_bool_is_not_a_source_amount(self):
        with self.assertRaises(Rejected):canonical_replay([source(True)],[baseline(1)],refs())

    def test_duplicate_source_cannot_reuse_stable_fact_id(self):
        with self.assertRaises(Rejected):canonical_replay([source(),source()],[baseline()],refs())

    def test_category_override_precedes_function(self):
        rules=refs()['MAP_Public_Categories']
        self.assertEqual(category_for(dict(economic_id='ECON_AIA',function_id='FUNC_01'),rules),'CAT_AIA_OFFSET')

    def test_equal_priority_category_rules_rejected(self):
        rules=refs()['MAP_Public_Categories'];rules.append(copy.deepcopy(rules[0]))
        with self.assertRaises(Rejected):category_for(dict(function_id='FUNC_01'),rules)

    def test_serving_exact_financial_and_label_match(self):
        report=serving_qa(*serving_fixture())
        self.assertEqual(report['spending_rows'],2);self.assertEqual(report['every100_categories'],2)
        self.assertTrue(report['financial_amounts_exact']);self.assertFalse(report['publication_authorized'])

    def test_compensating_spending_errors_rejected(self):
        c,s,e,r=serving_fixture();s[0]['amount_jmd']=str(NET+11);s[1]['amount_jmd']='-11'
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_duplicate_group_not_hidden_by_different_record_id(self):
        c,s,e,r=serving_fixture();s.append(dict(s[0],record_id='OTHER'))
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_missing_group_rejected(self):
        c,s,e,r=serving_fixture()
        with self.assertRaises(Rejected):serving_qa(c,s[:-1],e,r)

    def test_changed_public_label_rejected(self):
        c,s,e,r=serving_fixture();s[0]['organisation_name']='Wrong agency'
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_every100_wrong_source_not_accepted_even_if_url_matches_catalogue(self):
        c,s,e,r=serving_fixture();r['Source_Catalog']['SUPPORTING']={'source_url':'https://www.mof.gov.jm/support.pdf'}
        e[0].update(source_id='SUPPORTING',source_url='https://www.mof.gov.jm/support.pdf')
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_wrong_denominator_rejected(self):
        c,s,e,r=serving_fixture();e[0]['denominator_amount_jmd']=str(NET+1)
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_nonfinite_share_rejected(self):
        c,s,e,r=serving_fixture();s[0]['share_of_total_pct']='NaN'
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_display_error_above_half_cent_rejected(self):
        c,s,e,r=serving_fixture();s[0]['share_of_total_pct']='100.006'
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_naive_timestamp_rejected(self):
        c,s,e,r=serving_fixture();s[0]['last_updated']='2026-07-20T15:00:00'
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_public_row_must_have_released_status(self):
        c,s,e,r=serving_fixture()
        with self.assertRaises(Rejected):serving_qa(c,s,e,r,True)

    def test_whitespace_record_id_would_be_dropped_by_frontend(self):
        c,s,e,r=serving_fixture();s[0]['record_id']='   '
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_ids_colliding_after_frontend_trim_rejected(self):
        c,s,e,r=serving_fixture();s[0]['record_id']='S0';s[1]['record_id']=' S0 '
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_blank_catalogue_url_cannot_make_blank_output_url_valid(self):
        c,s,e,r=serving_fixture();r['Source_Catalog'][SID]['source_url']=''
        for row in s+e:row['source_url']=''
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)

    def test_blank_reference_economic_label_cannot_validate_blank_display(self):
        c,s,e,r=serving_fixture();r['DIM_Economic_Classification']['ECON_21']['economic_name']=''
        s[0]['economic_name']=''
        with self.assertRaises(Rejected):serving_qa(c,s,e,r)


if __name__=='__main__':unittest.main()
