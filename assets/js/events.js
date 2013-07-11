jQuery(document).ready(function() {
    var body = jQuery('body');

    // Task open event
    body.on('dblclick', '.task', function(event) {
        var data = ko.dataFor(this);

        body.trigger('taskEdit', [data]);
    });

    // Story open event
    body.on('dblclick', '.story', function(event) {
        var data = ko.dataFor(this);

        body.trigger('storyEdit', [data]);
    });

    // Help click event
    jQuery('#functionHelp').on('click', 'a', function(event) {
        var source = jQuery('#help-generic').html();
        var template = Handlebars.compile(source);
        var templateData = {};

        var modal = bootbox.dialog(
            template(templateData),
            [
                {
                    label: "Close",
                    class: "pull-left",
                    callback: function () {
                    }
                }
            ],
            {
                header: "Generic help"
            }
        );
    });

    body.on('taskEdit', function(event, taskData) {
        var source = jQuery('#task-form-edit').html();
        var template = Handlebars.compile(source);
        var templateData = jQuery.extend(
            {},
            ko.toJS(taskData),
            {
                users: ko.toJS(myViewModel.users()),
                types: ko.toJS(myViewModel.types())
            }
        );

        var modal = bootbox.dialog(
            template(templateData),
            [
                {
                    label: "Close",
                    class: "pull-left",
                    callback: function () {
                    }
                },
                {
                    label: "Save",
                    class: "btn-primary pull-right",
                    callback: function () {
                        var form = jQuery('#formTaskEdit');
                        var formItems = form.serializeJSON();

                        if (validateForm(formItems)) {
                            jQuery.ajax({
                                type: "PUT",
                                url: "/task/" + taskData.id(),
                                data: formItems,
                                dataType: 'json'
                            }).done(function (/** models.task */task) {
                                // TODO: update model data

                                jQuery('div.bootbox').modal('hide');
                            })
                            .fail(function (jqxhr, textStatus, error) {
                                handleAjaxError(jqxhr, textStatus, error);
                            });
                        }

                        return false;
                    }
                },
                {
                    label: "Delete",
                    class: "btn-danger pull-right",
                    callback: function () {
                        bootbox.confirm(
                            "Are you sure of task delete?",
                            function(result) {
                                if (result) {
                                    jQuery.ajax({
                                        type: "DELETE",
                                        url: "/task/" + taskData.id(),
                                        dataType: 'json'
                                    }).done(function () {
                                        myViewModel.deleteTask(taskData.id(), taskData.phaseId(), taskData.storyId());
                                    })
                                    .fail(function (jqxhr, textStatus, error) {
                                        handleAjaxError(jqxhr, textStatus, error);
                                    });
                                } else {
                                    body.trigger('taskEdit', [taskData]);
                                }
                            }
                        );
                    }
                }
            ],
            {
                header: "Edit task"
            }
        );

        modal.on('shown', function() {
            var inputTitle = jQuery('input[name="title"]', modal);

            inputTitle.focus().val(inputTitle.val());

            jQuery('textarea', modal).autosize();
        });
    });


    body.on('storyEdit', function(event, storyData) {
        var source = jQuery('#story-form-edit').html();
        var template = Handlebars.compile(source);
        var templateData = jQuery.extend(
            {},
            ko.toJS(storyData),
            {
            }
        );

        var modal = bootbox.dialog(
            template(templateData),
            [
                {
                    label: "Close",
                    class: "pull-left",
                    callback: function () {
                    }
                },
                {
                    label: "Save",
                    class: "btn-primary pull-right",
                    callback: function () {
                        var form = jQuery('#formStoryEdit');
                        var formItems = form.serializeJSON();

                        if (validateForm(formItems)) {
                            jQuery.ajax({
                                type: "PUT",
                                url: "/story/" + storyData.id(),
                                data: formItems,
                                dataType: 'json'
                            }).done(function (/** models.story */story) {
                                    // TODO: update model data

                                    jQuery('div.bootbox').modal('hide');
                                })
                                .fail(function (jqxhr, textStatus, error) {
                                    handleAjaxError(jqxhr, textStatus, error);
                                });
                        }

                        return false;
                    }
                },
                {
                    label: "Delete",
                    class: "btn-danger pull-right",
                    callback: function () {
                        bootbox.confirm(
                            "Are you sure of story delete?",
                            function(result) {
                                if (result) {
                                    jQuery.ajax({
                                        type: "DELETE",
                                        url: "/story/" + storyData.id(),
                                        dataType: 'json'
                                    }).done(function () {
                                            myViewModel.deleteStory(storyData.id());
                                        })
                                        .fail(function (jqxhr, textStatus, error) {
                                            handleAjaxError(jqxhr, textStatus, error);
                                        });
                                } else {
                                    body.trigger('storyEdit', [storyData]);
                                }
                            }
                        );
                    }
                }
            ],
            {
                header: "Edit story"
            }
        );

        modal.on('shown', function() {
            var inputTitle = jQuery('input[name="title"]', modal);

            inputTitle.focus().val(inputTitle.val());

            jQuery('textarea', modal).autosize();
        });
    });

    /**
     * Project phases edit
     */
    body.on('phasesEdit', function(event) {
        var source = jQuery('#phases-form-edit').html();
        var template = Handlebars.compile(source);
        var templateData = {
            project: ko.toJS(myViewModel.project()),
            phases: ko.toJS(myViewModel.phases())
        };

        var modal = bootbox.dialog(
            template(templateData),
            [
                {
                    label: "Close",
                    class: "pull-left",
                    callback: function () {
                    }
                },
                {
                    label: "Save",
                    class: "btn-primary pull-right",
                    callback: function () {
                        var errors = false;
                        var lines = jQuery("#projectPhases", modal).find("tbody tr");

                        lines.each(function(key) {
                            var row = jQuery(this);
                            var title = jQuery.trim(row.find('input[name="title[]"]').val());
                            var tasks = parseInt(row.find('input[name="tasks[]"]').val(), 10);
                            var phaseId = parseInt(row.find('input[name="id[]"]').val(), 10);

                            if (title.length == 0) {
                                row.addClass('error');
                            } else {
                                row.removeClass('error');

                                var type = '';
                                var url = '';

                                var phaseData = {
                                    title: title,
                                    order: key,
                                    tasks: isNaN(tasks) ? 0 : tasks,
                                    projectId: ko.toJS(myViewModel.project().id())
                                }

                                if (isNaN(phaseId)) {
                                    type = 'POST';
                                    url = ''
                                } else {
                                    type = 'PUT';
                                    url = phaseId;
                                }

                                jQuery.ajax({
                                    type: type,
                                    url: "/phase/" + url,
                                    data: phaseData,
                                    dataType: 'json'
                                }).done(function (/** models.phase */phase) {
                                    switch (type) {
                                        case 'POST':
                                            myViewModel.phases.push(new Phase(phase));
                                            break;
                                        case 'PUT':
                                            // TODO: update model data
                                            break;
                                    }
                                })
                                .fail(function (jqxhr, textStatus, error) {
                                    errors = true;

                                    handleAjaxError(jqxhr, textStatus, error);
                                });
                            }
                        });

                        return false;
                    }
                },
                {
                    label: "Add new phase",
                    class: "pull-right",
                    callback: function () {
                        var newRow = jQuery('#projectPhasesNew', modal).find('tr').clone();
                        var slider = newRow.find('.slider');
                        var input = slider.next('input');
                        var currentValue = parseInt(input.val(), 10);
                        var cellValue = slider.parent().next('td');

                        cellValue.html('unlimited');

                        slider.slider({
                            min: 0,
                            max: 10,
                            value: 0,
                            slide: function(event, ui) {
                                if (isNaN(ui.value) || ui.value === 0) {
                                    cellValue.html('unlimited');
                                } else {
                                    cellValue.html(ui.value);
                                }

                                input.val(ui.value);
                            }
                        });

                        jQuery('#projectPhases', modal).find('tbody').append(newRow);

                        return false;
                    }
                }
            ],
            {
                header: "Phases for project '" + ko.toJS(myViewModel.project().title()) +"'"
            }
        );

        modal.on('shown', function() {
            jQuery.each(jQuery('#projectPhases', modal).find('.slider'), function() {
                var slider = jQuery(this);
                var input = slider.next('input');
                var currentValue = parseInt(input.val(), 10);
                var cellValue = slider.parent().next('td');

                if (isNaN(currentValue) || currentValue === 0) {
                    cellValue.html('unlimited');
                } else {
                    cellValue.html(currentValue);
                }

                slider.slider({
                    min: 0,
                    max: 10,
                    value: currentValue,
                    slide: function(event, ui) {
                        if (isNaN(ui.value) || ui.value === 0) {
                            cellValue.html('unlimited');
                        } else {
                            cellValue.html(ui.value);
                        }

                        input.val(ui.value);
                    }
                });
            });

            var fixHelper = function(e, ui) {
                ui.children().each(function() {
                    jQuery(this).width(jQuery(this).width());
                });

                return ui;
            };

            var sortable = jQuery("#projectPhases").find("tbody");

            sortable.sortable({
                helper: fixHelper,
                axis: 'y',
                cursor: 'move',
                stop: function (event, ui) {
                    jQuery.each(sortable.find('tr'), function(key) {
                        var row = jQuery(this);
                        var phaseId = row.data('phaseId');

                        row.find('input[name="order['+ phaseId +']"]').val(key);
                    });
                }
            }).disableSelection();
        });
    });
});