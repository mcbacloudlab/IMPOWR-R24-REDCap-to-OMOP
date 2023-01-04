namespace :redcap2omop do
  namespace :setup do
    namespace :IMPOWR do
      desc 'setup IMPOWR project'
      task project: :environment do  |t, args|
        redcap_project = Redcap2omop::RedcapProject.new(project_id: 1 , name: 'IMPOWR', api_import: true, insert_person: true, api_token: ENV["REDCAP2_OMOP_API_TOKEN"]).save!
      end

      desc "setup mappings for IMPOWR"
      task maps: :environment do  |t, args|
        redcap_project          = Redcap2omop::RedcapProject.where(name: 'IMPOWR').first
        redcap_data_dictionary  = Redcap2omop::RedcapDataDictionary.find(redcap_project.redcap_data_dictionaries.maximum(:id))

        #patient
        #redcap_variable
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'demguid', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        omop_column = Redcap2omop::OmopColumn.joins(:omop_table).where("redcap2omop_omop_tables.name = 'person' AND redcap2omop_omop_columns.name = 'person_source_value'").first
        redcap_variable.build_redcap_variable_map(omop_column_id: omop_column.id, map_type: Redcap2omop::RedcapVariableMap::REDCAP_VARIABLE_MAP_MAP_TYPE_OMOP_COLUMN)
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_MAPPED
        redcap_variable.save!

        # form "patient_demographics"
        #redcap_variable
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'impd_brthdtc', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        omop_column = Redcap2omop::OmopColumn.joins(:omop_table).where("redcap2omop_omop_tables.name = 'person' AND redcap2omop_omop_columns.name = 'birth_datetime'").first
        redcap_variable.build_redcap_variable_map(omop_column_id: omop_column.id, map_type: Redcap2omop::RedcapVariableMap::REDCAP_VARIABLE_MAP_MAP_TYPE_OMOP_COLUMN)
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_MAPPED
        redcap_variable.save!

        #redcap_variable
        # come back
        # add support for derived numbers
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'imp_age', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_SKIPPED
        redcap_variable.save!

        #redcap_variable
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'impd_ethnic', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        omop_column = Redcap2omop::OmopColumn.joins(:omop_table).where("redcap2omop_omop_tables.name = 'person' AND redcap2omop_omop_columns.name = 'ethnicity_concept_id'").first
        redcap_variable.build_redcap_variable_map(omop_column_id: omop_column.id, map_type: Redcap2omop::RedcapVariableMap::REDCAP_VARIABLE_MAP_MAP_TYPE_OMOP_COLUMN)
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_MAPPED
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Not Hispanic or Latino').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Ethnicity', concept_code: 'Not Hispanic').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!
		
        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Yes Hispanic or Latino').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Ethnicity', concept_code: 'Hispanic').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Unknown').first
		redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Meas Value', concept_code: 'LA4489-6').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Decline to answer').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Meas Value', concept_code: 'LA27922-6').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        #redcap_variable
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'impd_race', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        omop_column = Redcap2omop::OmopColumn.joins(:omop_table).where("redcap2omop_omop_tables.name = 'person' AND redcap2omop_omop_columns.name = 'race_concept_id'").first
        redcap_variable.build_redcap_variable_map(omop_column_id: omop_column.id, map_type: Redcap2omop::RedcapVariableMap::REDCAP_VARIABLE_MAP_MAP_TYPE_OMOP_COLUMN)
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_MAPPED
        redcap_variable.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'White').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '5').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!
		
        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Black/African American').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '3').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'American Indian or Alaska Native').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '1').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!		

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Asian').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '2').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!
		
        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Native Hawaiian or Other Pacific Islander').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '4').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Some other race').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '9').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!
		
        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Unknown').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: 'UNK').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Prefer not to answer').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Race', concept_code: '415226007').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        #redcap_variable
        redcap_variable = Redcap2omop::RedcapVariable.where(name: 'impdgenid', redcap_data_dictionary_id: redcap_data_dictionary.id).first
        omop_column = Redcap2omop::OmopColumn.joins(:omop_table).where("redcap2omop_omop_tables.name = 'person' AND redcap2omop_omop_columns.name = 'gender_concept_id'").first
        redcap_variable.build_redcap_variable_map(omop_column_id: omop_column.id, map_type: Redcap2omop::RedcapVariableMap::REDCAP_VARIABLE_MAP_MAP_TYPE_OMOP_COLUMN)
        redcap_variable.curation_status = Redcap2omop::RedcapVariable::REDCAP_VARIABLE_CURATION_STATUS_MAPPED
        redcap_variable.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Female').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: 'F').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Male').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: 'M').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Transgender man/trans man/female-to-male (FTM)').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: '407379008').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Transgender woman/trans woman/male-to-female (MTF)').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: '407378000').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Genderqueer').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Observation', concept_code: 'SexualityCloserDescription_Queer').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Nonbinary').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: '772004004').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Agender').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: '394744001').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Gender Fluid').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: 0, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Some other gender').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Gender', concept_code: 'O').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

        redcap_variable_choice = redcap_variable.redcap_variable_choices.where(choice_description: 'Prefer not to answer').first
        redcap_variable_choice.build_redcap_variable_choice_map(concept_id: Redcap2omop::Concept.where(domain_id: 'Meas Value', concept_code: 'LA28803-7').first.concept_id, map_type: Redcap2omop::RedcapVariableChoiceMap::REDCAP_VARIABLE_CHOICE_MAP_MAP_TYPE_OMOP_CONCEPT)
        redcap_variable_choice.curation_status = Redcap2omop::RedcapVariableChoice::REDCAP_VARIABLE_CHOICE_CURATION_STATUS_MAPPED
        redcap_variable_choice.save!

      end
    end
  end
end